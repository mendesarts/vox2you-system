const { Op } = require('sequelize');
const Class = require('../models/Class');
const Course = require('../models/Course');
const Module = require('../models/Module');
const ClassSession = require('../models/ClassSession');
const Holiday = require('../models/Holiday');



// Helper Function Logic extracted from previous route
const generateScheduleForClass = async (classId) => {
    const classObj = await Class.findByPk(classId, {
        include: [{ model: Course, include: [{ model: Module }] }]
    });

    if (!classObj) throw new Error('Turma não encontrada');
    if (!classObj.Course) throw new Error('Turma sem curso associado');
    if (!classObj.Course.Modules || classObj.Course.Modules.length === 0) {
        throw new Error('Curso sem módulos cadastrados');
    }

    // 1. Setup Days
    let targetDays = [];
    try {
        let daysNames;
        if (Array.isArray(classObj.days)) {
            daysNames = classObj.days;
        } else if (typeof classObj.days === 'string') {
            try {
                if (classObj.days.startsWith('[')) {
                    daysNames = JSON.parse(classObj.days);
                } else {
                    daysNames = classObj.days.split(',').map(s => s.trim());
                }
            } catch (e) {
                daysNames = [classObj.days];
            }
        }
        const dayMap = { 'Dom': 0, 'Seg': 1, 'Ter': 2, 'Qua': 3, 'Qui': 4, 'Sex': 5, 'Sab': 6 };
        if (daysNames) {
            targetDays = daysNames.map(d => dayMap[d]).filter(d => d !== undefined);
        }
    } catch (e) {
        throw new Error('Erro ao processar dias da semana.');
    }

    if (targetDays.length === 0) throw new Error('Nenhum dia de aula válido selecionado.');

    const timeStr = classObj.startTime;

    // 2. Fetch Existing Sessions (to skip completed modules and block dates)
    const existingSessions = await ClassSession.findAll({
        where: {
            classId: classObj.id,
            status: { [Op.ne]: 'scheduled' } // Keep completed/cancelled
        }
    });

    // delete ONLY scheduled (future/pending)
    await ClassSession.destroy({
        where: {
            classId: classObj.id,
            status: 'scheduled'
        }
    });

    const completedModuleIds = new Set(existingSessions.map(s => String(s.moduleId)));
    const blockedDates = new Set();
    existingSessions.forEach(s => {
        if (s.date) blockedDates.add(String(s.date).substring(0, 10));
    }); // Block overlap

    // 3. Fetch Holidays & Recesses (Simplified: all in Holidays table are treated as blocks)
    const holidays = await Holiday.findAll({
        where: {
            [Op.or]: [
                { unitId: null },
                { unitId: classObj.unitId || 0 } // Handle null/undefined unitId
            ]
        }
    });

    console.log(`[ScheduleGen] Found ${holidays.length} holiday/recess signals to block for class ${classId}`);

    // Helper: Add days to date string
    const addDays = (dateStr, days) => {
        if (!dateStr) return null;
        const d = new Date(String(dateStr).substring(0, 10) + 'T12:00:00');
        d.setDate(d.getDate() + days);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    holidays.forEach(h => {
        let currentDay = String(h.startDate).substring(0, 10);
        const lastDay = h.endDate ? String(h.endDate).substring(0, 10) : currentDay;

        if (!currentDay || currentDay === 'null') return;

        let safety = 0;
        while (currentDay <= lastDay && safety < 366) {
            blockedDates.add(currentDay);
            currentDay = addDays(currentDay, 1);
            safety++;
        }
    });

    // 4. Generate Schedule
    const sortedModules = classObj.Course.Modules.sort((a, b) => a.order - b.order);

    // Determine Start Date: Max(ClassStart, LastSession + 1)
    let current = String(classObj.startDate).substring(0, 10);
    if (existingSessions.length > 0) {
        // Find max date
        const dates = existingSessions.map(s => String(s.date).substring(0, 10)).sort();
        const lastDate = dates[dates.length - 1];
        current = addDays(lastDate, 1); // Start after last session
    }

    const sessionsToCreate = [];

    // Filter modules to only remaining ones?
    // User wants to regenerate 'scheduled'. If a module is completed, skip it.

    for (const mod of sortedModules) {
        if (completedModuleIds.has(mod.id)) continue; // Skip completed

        let scheduled = false;
        let safety = 0;

        while (!scheduled && safety < 730) { // 2 years limit
            const dObj = new Date(current + 'T12:00:00');
            const dayOfWeek = dObj.getDay();

            // Check if day matches targets AND not blocked
            const currentStr = String(current).substring(0, 10);
            const isBlocked = blockedDates.has(currentStr);

            if (targetDays.includes(dayOfWeek) && !isBlocked) {
                sessionsToCreate.push({
                    classId: classObj.id,
                    moduleId: mod.id,
                    date: currentStr,
                    startTime: timeStr,
                    endTime: classObj.endTime, // Save configured EndTime
                    status: 'scheduled'
                });
                blockedDates.add(currentStr); // Block this new date too so we don't double book
                scheduled = true;
            } else if (isBlocked) {
                console.log(`[ScheduleGen] Skipping blocked date: ${currentStr} for class ${classId}`);
            }

            // Advance Day
            current = addDays(current, 1);
            safety++;
        }
    }

    if (sessionsToCreate.length > 0) {
        await ClassSession.bulkCreate(sessionsToCreate);
        // Find the absolute last session (could be historical or newly created)
        const allSessions = await ClassSession.findAll({
            where: { classId: classObj.id },
            order: [['date', 'DESC']],
            limit: 1
        });
        if (allSessions.length > 0) {
            await classObj.update({ endDate: allSessions[0].date });
        }
    } else {
        // If no new sessions, still update endDate based on last existing session if any
        const lastSession = await ClassSession.findOne({
            where: { classId: classObj.id },
            order: [['date', 'DESC']]
        });
        if (lastSession) {
            await classObj.update({ endDate: lastSession.date });
        }
    }

    return { count: sessionsToCreate.length, endDate: classObj.endDate };
};

const rescheduleAffectedClasses = async (unitId = null) => {
    // If unitId is null, it means a global holiday changed. We should reschedule ALL classes.
    // Otherwise, only classes in that unit.
    const where = {};
    if (unitId) where.unitId = unitId;

    const classes = await Class.findAll({ where });
    console.log(`Rescheduling ${classes.length} classes for unit ${unitId || 'GLOBAL'}...`);

    for (const c of classes) {
        try {
            await generateScheduleForClass(c.id);
        } catch (err) {
            console.error(`Failed to reschedule class ${c.id}:`, err.message);
        }
    }
};

module.exports = { generateScheduleForClass, rescheduleAffectedClasses };
