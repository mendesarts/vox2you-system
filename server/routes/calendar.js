const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');
const auth = require('../middleware/auth');
const { ROLE_IDS } = require('../config/roles'); // Import IDs
const Lead = require('../models/Lead');
const Task = require('../models/Task');
const CalendarBlock = require('../models/CalendarBlock');
const UserAvailability = require('../models/UserAvailability');
const Holiday = require('../models/Holiday');
const User = require('../models/User');
const Mentorship = require('../models/Mentorship');
const Student = require('../models/Student');

// Helper for Numeric ID compatibility - REMOVED (Strict Integer System)

// --- HOLIDAYS ENDPOINTS ---
// GET /api/calendar/holidays
router.get('/holidays', auth, async (req, res) => {
    try {
        const { unitId, roleId, email } = req.user;
        const numericUnitId = unitId ? parseInt(unitId) : null;

        const logPath = path.join(__dirname, '../debug_holidays.log');
        const logMsg = `[${new Date().toISOString()}] User:${email} ID:${roleId} Unit:${unitId} NumUnit:${numericUnitId}\n`;
        try { fs.appendFileSync(logPath, logMsg); } catch (e) { console.error('Log failed', e); }

        console.log('GET /holidays Request User:', { unitId, numericUnitId, roleId });

        let whereClause = {};

        // Use ID for Master/Director check
        const isMaster = [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(roleId);

        if (isMaster) {
            // Master can see Globals AND their specific Unit's holidays (if assigned)
            if (numericUnitId) {
                whereClause = {
                    [Op.or]: [
                        { unitId: numericUnitId },
                        { unitId: null }
                    ]
                };
            } else {
                whereClause = { unitId: null };
            }
        } else if (numericUnitId) {
            whereClause = {
                [Op.or]: [
                    { unitId: numericUnitId },
                    { unitId: null }
                ]
            };
        } else {
            whereClause = { unitId: null };
        }

        console.log('GET /holidays Where Clause:', whereClause);

        const holidays = await Holiday.findAll({
            where: whereClause,
            order: [['startDate', 'ASC']]
        });

        console.log(`Found ${holidays.length} holidays`);
        try { fs.appendFileSync(logPath, `[RESULT] Count: ${holidays.length} Where: ${JSON.stringify(whereClause)}\n`); } catch (e) { }

        res.json(holidays);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/calendar/holidays (Local/Recess only)
router.post('/holidays', auth, async (req, res) => {
    try {
        const { name, startDate, endDate, type, isGlobal, unitId } = req.body;

        // Allow overriding unitId (for numeric ID compatibility)
        let targetUnitId = unitId ? parseInt(unitId) : (req.user.unitId ? parseInt(req.user.unitId) : null);

        // Allow Master/Director to create Global Holidays (unitId = null)
        const canCreateGlobal = [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(req.user.roleId);

        if (isGlobal && canCreateGlobal) {
            targetUnitId = null;
        }

        const holiday = await Holiday.create({
            name,
            startDate,
            endDate: endDate || startDate,
            type: type || 'holiday',
            unitId: targetUnitId
        });
        res.json(holiday);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/calendar/holidays/:id
router.put('/holidays/:id', auth, async (req, res) => {
    try {
        const { unitId, roleId } = req.user;
        const numericUnitId = unitId ? parseInt(unitId) : null;
        const { name, startDate, endDate, type } = req.body;
        // Master/Director can edit any (Global or Local found by ID)
        // Others can only edit their own Unit's items
        const isMaster = [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(roleId);

        const whereClause = { id: req.params.id };
        if (!isMaster) {
            whereClause.unitId = numericUnitId;
        }

        const holiday = await Holiday.findOne({ where: whereClause });
        if (!holiday) return res.status(404).json({ error: 'Feriado não encontrado ou sem permissão.' });

        holiday.name = name || holiday.name;
        holiday.startDate = startDate || holiday.startDate;
        holiday.endDate = endDate || holiday.endDate || startDate;
        holiday.type = type || holiday.type;

        await holiday.save();
        res.json(holiday);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/calendar/holidays/:id
router.delete('/holidays/:id', auth, async (req, res) => {
    try {
        // Can only delete if it belongs to user's unit (can't delete National default)
        const { unitId, roleId } = req.user;
        const numericUnitId = unitId ? parseInt(unitId) : null;
        const isMaster = [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(roleId);

        const whereClause = { id: req.params.id };
        if (!isMaster) {
            whereClause.unitId = numericUnitId; // Others can only delete their own
        }

        const holiday = await Holiday.findOne({ where: whereClause });

        if (!holiday) {
            // Check if it exists but user has no permission (e.g. non-master trying to delete global)
            return res.status(404).json({ error: 'Feriado não encontrado ou sem permissão.' });
        }

        await holiday.destroy();
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const Course = require('../models/Course');
const Class = require('../models/Class');
const Module = require('../models/Module');
const ClassSession = require('../models/ClassSession');

// ... (existing imports/routes)

// GET /api/calendar/events
router.get('/events', auth, async (req, res) => {
    try {
        const { start, end, targetUserId } = req.query;
        const { unitId, role, roleId, id } = req.user;

        const startDate = start ? new Date(start) : new Date();
        const endDate = end ? new Date(end) : new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000);

        let scope = 'own';
        if ([ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR, ROLE_IDS.FRANCHISEE, ROLE_IDS.MANAGER, ROLE_IDS.ADMIN_FINANCIAL, ROLE_IDS.LEADER_PEDAGOGICAL, ROLE_IDS.LEADER_SALES].includes(roleId)) {
            scope = 'unit';
        }
        if (targetUserId) scope = 'target';

        // Base Where Clauses
        let leadWhere = {
            appointmentDate: { [Op.between]: [startDate, endDate] },
            status: 'scheduled'
        };
        let taskWhere = {
            dueDate: { [Op.between]: [startDate, endDate] }
        };
        let blockWhere = {
            startTime: { [Op.gte]: startDate },
            endTime: { [Op.lte]: endDate }
        };
        let mentorshipWhere = {
            scheduledDate: { [Op.between]: [startDate, endDate] },
            status: 'scheduled'
        };

        // Classes Logic
        // Force String Comparison for DATEONLY (YYYY-MM-DD)
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        let classSessionWhere = {
            date: { [Op.between]: [startStr, endStr] },
            status: 'scheduled'
        };
        let classIncludeWhere = {}; // Filter Class definition

        // Apply Scope
        if (scope === 'unit' || scope === 'own') {
            if (unitId) {
                // Models using UUID UnitID
                leadWhere.unitId = unitId;
                taskWhere.unitId = unitId;
                blockWhere.unitId = unitId;
                classIncludeWhere.unitId = unitId;
            }
        }

        if (scope === 'own') {
            // Use UUID 'id'
            leadWhere.consultantId = id;
            taskWhere.userId = id;
            blockWhere.userId = id;

            if (roleId === ROLE_IDS.CONSULTANT) {
                mentorshipWhere = null;
                classSessionWhere = null;
            } else {
                if (roleId === ROLE_IDS.INSTRUCTOR || role === 'instructor' || role === 'professor') {
                    classIncludeWhere.professorId = id;
                }
            }
        } else if (scope === 'target') {
            const uid = targetUserId; // Use raw UUID
            leadWhere.consultantId = uid;
            taskWhere.userId = uid;
            blockWhere.userId = uid;
            mentorshipWhere = null;
            classSessionWhere = null;
        }

        // FETCHING
        const promises = [
            Lead.findAll({
                where: leadWhere,
                include: [{ model: User, as: 'consultant', attributes: ['roleId', 'name'] }]
            }),
            Task.findAll({
                where: taskWhere,
                include: [{ model: User, attributes: ['name', 'roleId'] }]
            }),
            CalendarBlock.findAll({ where: blockWhere }),
        ];

        if (mentorshipWhere) {
            const mWhere = { ...mentorshipWhere };
            const sWhere = {};
            if (unitId) sWhere.unitId = unitId;

            promises.push(Mentorship.findAll({
                where: mWhere,
                include: [{ model: Student, where: sWhere, attributes: ['name'] }]
            }));
        } else {
            promises.push(Promise.resolve([]));
        }

        // Add Holidays Fetch (Unit + National)
        const dbHolidayWhere = {
            startDate: { [Op.between]: [startDate, endDate] }
        };

        // Strict Holiday Visibility:
        // 1. All Users see Global (unitId: null)
        // 2. Users with a Unit Context see their Unit's Local Holidays
        if (numericUnitId) {
            dbHolidayWhere[Op.or] = [
                { unitId: numericUnitId },
                { unitId: null }
            ];
        } else {
            dbHolidayWhere.unitId = null; // Globals Only (Master without context sees only Globals)
        }

        promises.push(Holiday.findAll({ where: dbHolidayWhere }));

        // Add Classes Fetch
        if (classSessionWhere) {
            // DEBUG: Log filter objects for class sessions
            console.log('DEBUG classSessionWhere:', JSON.stringify(classSessionWhere, null, 2));
            console.log('DEBUG classIncludeWhere:', JSON.stringify(classIncludeWhere, null, 2));

            promises.push(ClassSession.findAll({
                where: classSessionWhere,
                include: [
                    {
                        model: Class,
                        where: classIncludeWhere,
                        attributes: ['name']
                    },
                    {
                        model: Module,
                        attributes: ['title']
                    }
                ]
            }));
        } else {
            promises.push(Promise.resolve([]));
        }

        const [leads, tasks, blocks, mentorships, dbHolidays, classSessions] = await Promise.all(promises);

        const events = [];

        // Leads -> Commercial
        leads.forEach(l => events.push({
            id: `lead_${l.id}`, title: `Reunião: ${l.name}`, start: l.appointmentDate,
            end: new Date(new Date(l.appointmentDate).getTime() + 60 * 60000),
            type: 'commercial',
            roleId: l.consultant?.roleId, // Pass Owner Role
            data: l
        }));

        // Tasks -> check category
        tasks.forEach(t => events.push({
            id: `task_${t.id}`, title: `${t.title} (${t.User?.name || 'User'})`,
            start: t.dueDate, end: new Date(new Date(t.dueDate).getTime() + 30 * 60000),
            type: t.category || 'task',
            roleId: t.User?.roleId, // Pass User Role
            data: t
        }));

        // Blocks -> Block
        blocks.forEach(b => events.push({
            id: `block_${b.id}`, title: `Bloqueio: ${b.reason}`,
            start: b.startTime, end: b.endTime,
            type: 'block', data: b
        }));

        // Mentorships -> Pedagogical
        mentorships.forEach(m => events.push({
            id: `ment_${m.id}`, title: `Mentoria: ${m.Student?.name}`,
            start: m.scheduledDate, end: new Date(new Date(m.scheduledDate).getTime() + 60 * 60000),
            type: 'pedagogical', data: m
        }));

        // Holidays
        // Local (DB) and Global (DB)
        dbHolidays.forEach(h => {
            let prefix = '';
            if (!h.unitId) {
                // Global
                prefix = h.type === 'recess' ? '🏖️ ' : '🇧🇷 ';
            } else {
                // Local
                prefix = h.type === 'recess' ? 'Recesso: ' : 'Feriado: ';
            }

            events.push({
                id: `hol_${h.id}`,
                title: `${prefix}${h.name}`,
                start: h.startDate, end: h.endDate,
                type: h.type || 'holiday',
                isAllDay: true,
                global: !h.unitId
            });
        });

        // Classes (Sessions)
        try {
            fs.appendFileSync(logPath, `[CLASSES] Found ${classSessions.length} sessions.\n`);
        } catch (e) { }
        classSessions.forEach(cs => {
            // const className = cs.Class?.name || 'Turma'; // Removed per user request
            const moduleTitle = cs.Module?.title || 'Aula';
            const timePrefix = cs.startTime.substring(0, 5);
            const fullTitle = `${timePrefix} - ${courseName} - ${moduleTitle}`;

            // If endTime is missing, assume 2h duration or use startTime + 2h
            // Class model has endTime usually, session might override or duplicate.
            // Using safe logic:
            // Handle Midnight span
            // If endTime < startTime, assume next day
            try {
                // Paranoid: Ensure String type
                const rawStart = String(cs.startTime || '');
                const cleanStart = rawStart.length >= 5 ? rawStart.substring(0, 5) : '00:00';

                // Simple ISO-like string (Local Time interpretation)
                let startDateTime = `${cs.date}T${cleanStart}`;
                let endDateTime;

                if (cs.endTime) {
                    const rawEnd = String(cs.endTime);
                    const cleanEnd = rawEnd.length >= 5 ? rawEnd.substring(0, 5) : '00:00';
                    endDateTime = `${cs.date}T${cleanEnd}`;

                    // Handle Midnight span if endTime < startTime
                    if (cleanEnd < cleanStart) {
                        const d = new Date(cs.date + 'T12:00:00');
                        d.setDate(d.getDate() + 1);
                        const nextDay = d.toISOString().split('T')[0];
                        endDateTime = `${nextDay}T${cleanEnd}`;
                    }
                } else {
                    // Fail safe default
                    endDateTime = startDateTime;
                }

                events.push({
                    id: `class_${cs.id}`,
                    title: `${cs.Class?.name || 'Turma'} - ${cs.Module?.title || 'Aula'}`,
                    start: startDateTime,
                    end: endDateTime,
                    type: 'pedagogical',
                    isAllDay: false,
                    global: false,
                    data: { ...cs.toJSON(), isClass: true }
                });
            } catch (err) {
                console.error(`Error processing session class_${cs.id}:`, err);
                try { fs.appendFileSync(logPath, `[ERROR] Session ${cs.id}: ${err.message}\n`); } catch (e) { }
            }
        });


        res.json(events);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/calendar/blocks
router.post('/blocks', auth, async (req, res) => {
    try {
        const { startTime, endTime, reason, unitId, userId } = req.body;
        const block = await CalendarBlock.create({
            userId: userId || req.user.id,
            unitId: unitId || req.user.unitId,
            startTime,
            endTime,
            reason
        });
        res.json(block);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/calendar/blocks/:id
router.delete('/blocks/:id', auth, async (req, res) => {
    try {
        const { id, roleId, unitId } = req.user;
        const isPrivileged = [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR, ROLE_IDS.MANAGER, ROLE_IDS.ADMIN_FINANCIAL].includes(roleId);

        const whereClause = { id: req.params.id };
        if (!isPrivileged) {
            whereClause.userId = id;
        } else {
            // Privileged users can delete, but maybe restrict to unit?
            // Master sees all (unitId null or matches).
            // If not master, restrict to unitId matching block's unitId?
            // Lead with isPrivileged for now.
            if (roleId !== ROLE_IDS.MASTER) {
                whereClause.unitId = unitId;
            }
        }

        const block = await CalendarBlock.findOne({ where: whereClause });
        if (!block) return res.status(404).json({ error: 'Bloqueio não encontrado ou sem permissão.' });
        await block.destroy();
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/calendar/holidays/import-national
router.post('/holidays/import-national', auth, async (req, res) => {
    try {
        const { year } = req.body;
        const targetYear = year || new Date().getFullYear();

        // National Holidays List (Fixed)
        const holidays = [
            { name: 'Confraternização Universal', date: `${targetYear}-01-01` },
            { name: 'Tiradentes', date: `${targetYear}-04-21` },
            { name: 'Dia do Trabalho', date: `${targetYear}-05-01` },
            { name: 'Independência do Brasil', date: `${targetYear}-09-07` },
            { name: 'Nossa Senhora Aparecida', date: `${targetYear}-10-12` },
            { name: 'Finados', date: `${targetYear}-11-02` },
            { name: 'Proclamação da República', date: `${targetYear}-11-15` },
            { name: 'Natal', date: `${targetYear}-12-25` }
        ];

        // Add Movable (Simple calc or fixed for 2025/2026? Better use lib or approx?)
        // For MVP, user enters movable or we use a library. 
        // Let's stick to Fixed for now to avoid complexity, or calculate Easter roughly.
        // Skipping movable for safety unless requested.

        let count = 0;
        for (const h of holidays) {
            const existing = await Holiday.findOne({
                where: {
                    name: h.name,
                    startDate: h.date,
                    unitId: null // Global
                }
            });

            if (!existing) {
                await Holiday.create({
                    name: h.name,
                    startDate: h.date,
                    endDate: h.date,
                    type: 'national',
                    unitId: null
                });
                count++;
            }
        }

        res.json({ message: `Importados ${count} feriados nacionais para ${targetYear}.` });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
