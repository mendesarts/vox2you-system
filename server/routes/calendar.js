process.env.TZ = 'America/Sao_Paulo';
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
const FinancialRecord = require('../models/FinancialRecord');
const { rescheduleAffectedClasses } = require('../utils/scheduleGenerator');

// Helper for Numeric ID compatibility - REMOVED (Strict Integer System)

// --- HOLIDAYS ENDPOINTS ---
// GET /api/calendar/holidays
router.get('/holidays', auth, async (req, res) => {
    try {
        const { unitId, roleId, email } = req.user;

        // Consistent Hash Logic for UUID -> Integer (Matches Frontend)
        const getNumericId = (id) => {
            if (!id) return null;
            if (!isNaN(Number(id))) return Number(id);
            let hash = 0;
            const str = String(id);
            for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
            return Math.abs(hash);
        };

        const numericUnitId = unitId ? getNumericId(unitId) : null;

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

        // Consistent Hash Logic
        const getNumericId = (id) => {
            if (!id) return null;
            if (!isNaN(Number(id))) return Number(id);
            let hash = 0;
            const str = String(id);
            for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
            return Math.abs(hash);
        };

        // Allow overriding unitId (for numeric ID compatibility)
        let targetUnitId = unitId ? parseInt(unitId) : (req.user.unitId ? getNumericId(req.user.unitId) : null);

        // Allow Master/Director to create Global Holidays (unitId = null)
        const canCreateGlobal = [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(req.user.roleId);

        if (isGlobal && canCreateGlobal) {
            targetUnitId = null;
        }

        // PERMISSION CHECK
        // Consultants (41) and Instructors (51) CANNOT create holidays/recesses
        const restrictedRoles = [ROLE_IDS.CONSULTANT, ROLE_IDS.INSTRUCTOR];
        if (restrictedRoles.includes(Number(req.user.roleId))) {
            return res.status(403).json({ error: 'Acesso negado. Apenas gestão pode criar feriados/recessos.' });
        }

        const holiday = await Holiday.create({
            name,
            startDate,
            endDate: endDate || startDate,
            type: type || 'holiday',
            unitId: targetUnitId
        });

        // Trigger rescheduling
        await rescheduleAffectedClasses(targetUnitId);

        res.json(holiday);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/calendar/holidays/:id
router.put('/holidays/:id', auth, async (req, res) => {
    try {
        const { unitId, roleId } = req.user;
        const getNumericId = (id) => {
            if (!id) return null;
            if (!isNaN(Number(id))) return Number(id);
            let hash = 0;
            const str = String(id);
            for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
            return Math.abs(hash);
        };
        const numericUnitId = unitId ? getNumericId(unitId) : null;

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

        // Trigger rescheduling
        await rescheduleAffectedClasses(holiday.unitId);

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
        const getNumericId = (id) => {
            if (!id) return null;
            if (!isNaN(Number(id))) return Number(id);
            let hash = 0;
            const str = String(id);
            for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
            return Math.abs(hash);
        };
        const numericUnitId = unitId ? getNumericId(unitId) : null;

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

        const unitIdToReschedule = holiday.unitId;
        await holiday.destroy();

        // Trigger rescheduling
        await rescheduleAffectedClasses(unitIdToReschedule);

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
        const startDate = new Date(start);
        const endDate = new Date(end);

        const { unitId, role, roleId, id } = req.user;

        // Hash Logic
        const getNumericId = (id) => {
            if (!id) return null;
            if (!isNaN(Number(id))) return Number(id);
            let hash = 0;
            const str = String(id);
            for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
            return Math.abs(hash);
        };
        let numericUnitId = unitId ? getNumericId(unitId) : null;

        const numericRoleId = Number(roleId);
        try { fs.appendFileSync(path.join(__dirname, '../debug_calendar_scope.log'), `[${new Date().toISOString()}] User:${req.user.email} Role:${roleId} NumRole:${numericRoleId} MasterCheck:${[ROLE_IDS.MASTER].includes(numericRoleId)}\n`); } catch (e) { }

        // Allow Unit Override for Master/Director
        if ([ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(numericRoleId) && req.query.unitId !== undefined) {
            if (req.query.unitId === '' || req.query.unitId === 'all') {
                numericUnitId = null;
            } else {
                numericUnitId = getNumericId(req.query.unitId);
            }
        }

        // Role Filter Logic
        const roleWhere = {};
        if (req.query.roleFilter) {
            const rf = Number(req.query.roleFilter);
            if (!isNaN(rf)) {
                roleWhere.roleId = rf;
            }
        }

        let scope = 'own';
        // Managers, Admins, Franchisees see Unit Scope
        if ([ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR, ROLE_IDS.FRANCHISEE, ROLE_IDS.MANAGER, ROLE_IDS.ADMIN_FINANCIAL, ROLE_IDS.LEADER_PEDAGOGICAL, ROLE_IDS.LEADER_SALES].includes(numericRoleId)) {
            scope = 'unit';
        }
        if (targetUserId) scope = 'target';

        // Force String Comparison for DATEONLY (YYYY-MM-DD)
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        // Base Where Clauses
        let leadWhere = {
            appointmentDate: { [Op.between]: [startDate, endDate] },
            status: 'scheduled'
        };
        let taskWhere = {
            dueDate: { [Op.between]: [startDate, endDate] },
            status: { [Op.in]: ['pending', 'in_progress'] }
        };
        let financialWhere = {
            dueDate: { [Op.between]: [startStr, endStr] },
            status: { [Op.ne]: 'cancelled' }
        };
        let blockWhere = {
            startTime: { [Op.gte]: startDate },
            endTime: { [Op.lte]: endDate }
        };
        // Owner filter: only show blocks owned by the logged user unless privileged
        if (scope === 'own') {
            blockWhere.userId = Number(id);
        }
        let mentorshipWhere = {
            scheduledDate: { [Op.between]: [startDate, endDate] },
            status: 'scheduled'
        };

        let classSessionWhere = {
            date: { [Op.between]: [startStr, endStr] },
            status: 'scheduled'
        };
        let classIncludeWhere = {}; // Filter Class definition

        // Apply Scope
        if (scope === 'unit' || scope === 'own') {
            if (numericUnitId) {
                leadWhere.unitId = numericUnitId;
                taskWhere.unitId = numericUnitId;
                blockWhere.unitId = numericUnitId;
                classIncludeWhere.unitId = numericUnitId;
                financialWhere.unitId = numericUnitId;
            }
        }

        // --- SPECIFIC ROLE REFINEMENTS ---

        // 1. INSTRUCTORS & CONSULTANTS (Strict Own Scope)
        if (scope === 'own') {
            leadWhere.consultant_id = Number(id);
            taskWhere.userId = Number(id);
            blockWhere.userId = Number(id);

            if (numericRoleId === ROLE_IDS.CONSULTANT) {
                // Consultant sees Unit Classes/Mentorships (via defaultUnit logic), plus Own Leads/Tasks
            } else if (numericRoleId === ROLE_IDS.INSTRUCTOR || role === 'instructor') {
                classIncludeWhere.professorId = id;
                mentorshipWhere.mentorId = id; // STRICT: Only own mentorships
            }
        }
        // 2. LEADERS (Unit Scope but Department Focused)
        else if (scope === 'unit') {
            // SALES LEADER (40): Focus on Commercial
            if (numericRoleId === ROLE_IDS.LEADER_SALES) {
                mentorshipWhere = null;
                classSessionWhere = null;
                financialWhere = null; // Sales Focus
                // Sees all Unit Leads & Tasks (Set by generic unit logic above)
            }
            // PEDAGOGICAL LEADER (50): Focus on Pedagogical
            else if (numericRoleId === ROLE_IDS.LEADER_PEDAGOGICAL) {
                leadWhere = null; // Hide Sales Leads to avoid clutter? Or keep? Usually separate.
                // Sees all Unit Classes & Mentorships
            }
            // MANAGER/FRANCHISEE/GLOBAL: See Everything
        }

        // 3. TARGET (Admin Inspecting User)
        else if (scope === 'target') {
            const uid = Number(targetUserId);
            leadWhere.consultant_id = uid;
            taskWhere.userId = uid;
            blockWhere.userId = uid;
            mentorshipWhere = null; // Simplify target view
            classSessionWhere = null;
        }

        // FETCHING
        const promises = [
            leadWhere ? Lead.findAll({
                where: leadWhere,
                include: [{ model: User, as: 'consultant', attributes: ['roleId', 'name'], where: roleWhere }]
            }) : Promise.resolve([]),

            taskWhere ? Task.findAll({
                where: taskWhere,
                include: [{ model: User, attributes: ['name', 'roleId'], where: roleWhere }]
            }) : Promise.resolve([]),

            blockWhere ? CalendarBlock.findAll({
                where: blockWhere,
                include: [{ model: User, as: 'owner', attributes: ['name', 'roleId'], where: roleWhere }]
            }) : Promise.resolve([]),

            financialWhere ? FinancialRecord.findAll({
                where: financialWhere
            }) : Promise.resolve([]),
        ];

        if (mentorshipWhere) {
            const mWhere = { ...mentorshipWhere };
            const sWhere = {};
            if (numericUnitId) sWhere.unitId = numericUnitId;

            promises.push(Mentorship.findAll({
                where: mWhere,
                include: [{ model: Student, where: sWhere, attributes: ['name'] }]
            }));
        } else {
            promises.push(Promise.resolve([]));
        }

        // Helper: split an event that spans multiple months into separate month‑bounded pieces
        const splitByMonth = (ev) => {
            const start = new Date(ev.start);
            const end = new Date(ev.end);
            const parts = [];
            let cur = new Date(start);
            let partIndex = 0;
            while (cur <= end) {
                // End of the current month
                const monthEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
                const partEnd = monthEnd < end ? monthEnd : end;
                parts.push({
                    ...ev,
                    id: `${ev.id}_p${partIndex}`,
                    start: cur.toISOString().split('T')[0],
                    end: partEnd.toISOString().split('T')[0]
                });
                // Move to next day after this part
                cur = new Date(partEnd);
                cur.setDate(cur.getDate() + 1);
                partIndex++;
            }
            return parts;
        };
        // Include holidays/recesses that overlap the requested interval.
        // An event should be returned if its startDate is before the end of the range
        // AND its endDate is after the start of the range.
        const dbHolidayWhere = {
            [Op.and]: [
                { startDate: { [Op.lte]: endDate } },
                { endDate: { [Op.gte]: startDate } }
            ]
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
            // If Master/Director and NO unit selected (All), show ALL holidays (Global + Any Unit)
            // Otherwise (e.g. unassigned user?), show only Globals
            if (![ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(numericRoleId)) {
                dbHolidayWhere.unitId = null;
            }
            // If Master, we leave unitId unconstrained (shows all)
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
                        attributes: ['name', 'professorId'],
                        include: [
                            { model: Course, attributes: ['name'] },
                            { model: User, as: 'professor', attributes: ['name', 'roleId'] }
                        ]
                    },
                    {
                        model: Module,
                        attributes: ['title', 'order']
                    }
                ]
            }));
        } else {
            promises.push(Promise.resolve([]));
        }

        const [leads, tasks, blocks, financialRecords, mentorships, dbHolidays, classSessions] = await Promise.all(promises);

        const events = [];

        // Leads -> Commercial (Consultorias Agendadas)
        leads.forEach(l => events.push({
            id: `lead_${l.id}`,
            title: 'Consultoria', // Fixed title per user request
            start: l.appointmentDate,
            end: new Date(new Date(l.appointmentDate).getTime() + 60 * 60000),
            type: 'commercial',
            roleId: l.consultant?.roleId,
            responsibleName: l.consultant ? l.consultant.name : null,
            responsibleRoleId: l.consultant ? l.consultant.roleId : null,
            data: l
        }));

        // Blocks -> Block
        blocks.forEach(b => events.push({
            id: `block_${b.id}`,
            userId: b.userId,
            title: `Bloqueio: ${b.reason}`,
            start: b.startTime,
            end: b.endTime,
            type: 'block',
            userId: b.userId,
            responsibleName: b.owner ? b.owner.name : null,
            responsibleRoleId: b.owner ? b.owner.roleId : null,
            data: b
        }));

        // Mentorships -> Pedagogical
        mentorships.forEach(m => events.push({
            id: `ment_${m.id}`,
            title: `🎓 Mentoria: ${m.Student?.name}`,
            start: m.scheduledDate,
            end: new Date(new Date(m.scheduledDate).getTime() + 60 * 60000),
            type: 'mentorship',
            data: m
        }));


        // Tasks -> Administrative (Only show tasks with leadId AND related to Agendamento)
        // Other tasks (non-CRM or CRM-Followup) should only appear in the Tasks page
        tasks.filter(t => {
            if (!t.leadId) return false;
            const title = (t.title || '').toLowerCase();
            return title.includes('reunião') || title.includes('agendamento') || title.includes('sessão');
        }).forEach(t => events.push({
            id: `task_${t.id}`,
            title: t.title,
            start: t.dueDate,
            end: t.dueDate,
            type: 'administrative',
            isAllDay: false,
            responsibleName: t.User ? t.User.name : null,
            responsibleRoleId: t.User ? t.User.roleId : null,
            data: t
        }));

        // Financial -> Financial
        financialRecords.forEach(f => events.push({
            id: `fin_${f.id}`,
            title: `${f.direction === 'income' ? '💰' : '💸'} ${f.description || f.category}`,
            start: f.dueDate,
            end: f.dueDate,
            type: 'financial',
            isAllDay: true,
            data: f
        }));

        // Holidays & Recesses (Intelligence: Feriado > Recesso)
        const holidayDatesFound = new Set();
        const holidayEventsProcessed = [];
        const recessEventsProcessed = [];

        dbHolidays.forEach(h => {
            const isRecess = h.type === 'recess' || (h.name && h.name.toLowerCase().includes('recesso'));
            const emojiPrefix = isRecess ? '🌴 ' : '✨ ';
            const effectiveType = isRecess ? 'recess' : 'holiday';

            const baseEvent = {
                id: `hol_${h.id}`,
                title: `${emojiPrefix}${h.name}`,
                start: h.startDate,
                end: h.endDate,
                type: effectiveType,
                isAllDay: true,
                global: !h.unitId
            };

            if (!isRecess) {
                holidayEventsProcessed.push(baseEvent);
                // Mark dates covered by this REAL holiday
                let curr = new Date(h.startDate + 'T12:00:00');
                let last = new Date(h.endDate + 'T12:00:00');
                while (curr <= last) {
                    holidayDatesFound.add(curr.toISOString().split('T')[0]);
                    curr.setDate(curr.getDate() + 1);
                }
            } else {
                recessEventsProcessed.push(baseEvent);
            }
        });

        // 1. Add Holidays (Always shown)
        holidayEventsProcessed.forEach(he => {
            const isRange = new Date(he.end) > new Date(he.start);
            if (isRange) {
                const parts = splitByMonth(he);
                parts.forEach(p => events.push(p));
            } else {
                events.push(he);
            }
        });

        // 2. Add Recesses (Split or skipped if holiday exists on same day)
        recessEventsProcessed.forEach((re, idx) => {
            let curr = new Date(re.start + 'T12:00:00');
            let endD = new Date(re.end + 'T12:00:00');
            let segmentStart = null;
            let segmentIndex = 0;

            while (curr <= endD) {
                const dateStr = curr.toISOString().split('T')[0];
                const hasHoliday = holidayDatesFound.has(dateStr);

                if (!hasHoliday) {
                    if (!segmentStart) segmentStart = dateStr;
                } else {
                    if (segmentStart) {
                        // Close segment before the holiday
                        let segEnd = new Date(curr);
                        segEnd.setDate(segEnd.getDate() - 1);
                        const segEndStr = segEnd.toISOString().split('T')[0];
                        const sub = { ...re, id: `${re.id}_seg${segmentIndex}`, start: segmentStart, end: segEndStr };
                        const isRange = new Date(segEndStr) > new Date(segmentStart);
                        if (isRange) {
                            const parts = splitByMonth(sub);
                            parts.forEach(p => events.push(p));
                        } else {
                            events.push(sub);
                        }
                        segmentStart = null;
                        segmentIndex++;
                    }
                }
                curr.setDate(curr.getDate() + 1);
            }
            if (segmentStart) {
                const sub = { ...re, id: `${re.id}_seg${segmentIndex}`, start: segmentStart, end: re.end };
                const isRange = new Date(re.end) > new Date(segmentStart);
                if (isRange) {
                    const parts = splitByMonth(sub);
                    parts.forEach(p => events.push(p));
                } else {
                    events.push(sub);
                }
            }
        });

        // Classes (Sessions)
        try {
            fs.appendFileSync(logPath, `[CLASSES] Found ${classSessions.length} sessions.\n`);
        } catch (e) { }
        classSessions.forEach(cs => {
            const courseName = cs.Class?.Course?.name || 'Curso';
            const moduleTitle = cs.Module?.title || 'Aula';
            const timePrefix = (cs.startTime || '00:00').substring(0, 5);
            const fullTitle = `${cs.Class?.name} - ${moduleTitle}`;

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
                    title: `📚 ${cs.Class?.name || 'Turma'} - ${moduleTitle}`,
                    start: startDateTime,
                    end: endDateTime,
                    type: 'pedagogical',
                    isAllDay: false,
                    global: false,
                    courseName: courseName,
                    className: cs.Class?.name || 'Turma',
                    moduleTitle: moduleTitle,
                    moduleOrder: cs.Module?.order,
                    classId: cs.classId,
                    responsibleName: cs.Class?.professor?.name || null,
                    responsibleRoleId: cs.Class?.professor?.roleId || null,
                    data: { ...cs.toJSON(), isClass: true, lessonNumber: cs.sessionNumber }
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

// PUT /api/calendar/blocks/:id
router.put('/blocks/:id', auth, async (req, res) => {
    try {
        const { id, roleId, unitId } = req.user;
        const { startTime, endTime, reason } = req.body;
        const isPrivileged = [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR, ROLE_IDS.MANAGER, ROLE_IDS.ADMIN_FINANCIAL].includes(roleId);

        const whereClause = { id: req.params.id };
        if (!isPrivileged) {
            whereClause.userId = id;
        } else if (roleId !== ROLE_IDS.MASTER) {
            whereClause.unitId = unitId;
        }

        const block = await CalendarBlock.findOne({ where: whereClause });
        if (!block) return res.status(404).json({ error: 'Bloqueio não encontrado ou sem permissão.' });

        if (startTime) block.startTime = startTime;
        if (endTime) block.endTime = endTime;
        if (reason) block.reason = reason;

        await block.save();
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
                    type: 'holiday',
                    unitId: null
                });
                count++;
            }
        }

        // Trigger rescheduling for all units as national holidays are global
        await rescheduleAffectedClasses(null);

        res.json({ message: `Importados ${count} feriados nacionais para ${targetYear}.` });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
