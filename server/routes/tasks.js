const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// Sync model on load (optional, usually done in index or separate script)
// Task.sync({ alter: true }).catch(err => console.log('Task sync error:', err));

const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { ROLE_IDS } = require('../config/roles');
const { checkUnitIsolation } = require('../utils/unitIsolation');
const User = require('../models/User');
const ClassSession = require('../models/ClassSession');
const Mentorship = require('../models/Mentorship');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Course = require('../models/Course');
const Module = require('../models/Module');
const Lead = require('../models/Lead');

// Listar todas as tarefas (Com filtros e regras de visualização)
router.get('/', auth, async (req, res) => {
    try {
        const { unitId: rawUnitId, roleId: rawRoleId, id: rawId } = req.user;
        const { unitId: queryUnitId, start, end } = req.query;

        // Helper for consistent ID interpretation
        const getNumericId = (id) => {
            if (!id) return null;
            if (!isNaN(Number(id))) return Number(id);
            let hash = 0;
            const str = String(id);
            for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
            return Math.abs(hash);
        };

        const unitId = getNumericId(rawUnitId);
        const roleId = Number(rawRoleId);
        const id = getNumericId(rawId);

        const isGlobalUser = [1, 10].includes(roleId);

        let where = {};

        // 1. Unit Filter (Base Logic)
        if (isGlobalUser) {
            if (queryUnitId) where.unitId = getNumericId(queryUnitId);
        } else if (unitId) {
            where.unitId = unitId;
        }

        // 2. Date Filter
        if (start && end) {
            // Append end of day time to 'end' to ensure tasks ON the end date are included
            const endDateInclusive = end.includes('T') ? end : `${end}T23:59:59.999Z`;
            where.dueDate = { [Op.between]: [start, endDateInclusive] };
        } else if (start) {
            where.dueDate = { [Op.gte]: start };
        }

        // 3. Role Visibility Logic
        const numericRoleId = Number(roleId);

        // Restricted Profiles: Instructor (51), Consultant (41) -> Access OWN tasks only.
        if ([ROLE_IDS.INSTRUCTOR, ROLE_IDS.CONSULTANT].includes(numericRoleId)) {
            where.userId = id;
        }
        // Sales Leader (40): Access OWN + Consultants (41) tasks.
        else if (numericRoleId === ROLE_IDS.LEADER_SALES) {
            const team = await User.findAll({
                where: { unitId, roleId: ROLE_IDS.CONSULTANT },
                attributes: ['id']
            });
            where.userId = { [Op.in]: [...team.map(u => u.id), id] };
        }
        // Pedagogical Leader (50): Access OWN + Instructors (51) tasks.
        else if (numericRoleId === ROLE_IDS.LEADER_PEDAGOGICAL) {
            const team = await User.findAll({
                where: { unitId, roleId: ROLE_IDS.INSTRUCTOR },
                attributes: ['id']
            });
            where.userId = { [Op.in]: [...team.map(u => u.id), id] };
        }
        // Other Roles (Master, Director, Franchisee, Manager, Admin-Fin)
        // They fall through here and see ALL tasks in the unit (filtered by unitId above).
        // Global/Proiles (Master, Director, Franchisee, Manager, Admin-Fin) -> Access ALL in Unit (Base filter handles Unit, Master sees all if Unit not set).

        // --- PRE-FETCH CLEANUP (Global Self-Healing for this User/Unit) ---
        // 1. Close all pending commercial tasks for Won/Closed leads in this scope
        const leadsToClear = await Lead.findAll({
            where: {
                status: ['won', 'closed'],
                deletedAt: null,
                ...(where.unitId ? { unitId: where.unitId } : {})
            },
            attributes: ['id']
        });

        if (leadsToClear.length > 0) {
            await Task.update({ status: 'done' }, {
                where: {
                    leadId: { [Op.in]: leadsToClear.map(l => l.id) },
                    status: 'pending',
                    title: { [Op.notLike]: 'Matricular Aluno%' } // Keep enrollment tasks
                }
            });
        }

        // 2. Ensure only one pending commercial task per lead (keep the one with furthest dueDate)
        // This query finds all leads with more than 1 pending task in this scope
        const pendingCounts = await Task.findAll({
            attributes: ['leadId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
            where: {
                leadId: { [Op.ne]: null },
                status: 'pending',
                ...(where.unitId ? { unitId: where.unitId } : {}),
                ...(where.userId ? { userId: where.userId } : {})
            },
            group: ['leadId'],
            having: sequelize.literal('COUNT("id") > 1')
        });

        for (const pc of pendingCounts) {
            const lid = pc.leadId;
            const lidTasks = await Task.findAll({
                where: { leadId: lid, status: 'pending' },
                order: [['dueDate', 'DESC']]
            });
            if (lidTasks.length > 1) {
                const [keep, ...others] = lidTasks;
                await Task.update({ status: 'done' }, {
                    where: { id: { [Op.in]: others.map(o => o.id) } }
                });
            }
        }

        let tasks = await Task.findAll({
            where,
            order: [['dueDate', 'ASC']],
            include: [
                {
                    model: User,
                    attributes: ['id', 'name', 'roleId']
                },
                {
                    model: Lead,
                    attributes: ['id', 'status', 'name', 'source', 'deletedAt'],
                    required: false
                }
            ]
        });

        // FILTER: Remove tasks from deleted leads
        tasks = tasks.filter(t => {
            // Keep tasks without lead
            if (!t.leadId) return true;
            // Remove tasks where lead was found but is soft-deleted
            if (t.Lead && t.Lead.deletedAt) return false;
            // Remove tasks where leadId exists but Lead is null (Hard deleted / Orphan)
            if (!t.Lead) return false;

            return true;
        });

        // --- SELF-HEALING & TERMINAL CLEANUP (DISABLED TEMPORARILY FOR DEBUGGING) ---
        // 1. One active task per Lead (The most recent one in the future)
        // 2. No pending tasks for Won/Closed Leads
        // const activeLeadTasks = new Map();
        // const tasksToCloseIds = [];
        //
        // tasks.forEach(t => {
        //     if (t.leadId && t.status === 'pending') {
        //         // Rule 2: No tasks for Won/Closed leads
        //         const isTerminal = t.Lead && ['won', 'closed'].includes(t.Lead.status);
        //         const isEnrollmentTask = t.title?.startsWith('Matricular Aluno:');
        //
        //         if (isTerminal && !isEnrollmentTask) {
        //             tasksToCloseIds.push(t.id);
        //         }
        //         // Rule 1: Only one pending task per lead
        //         else {
        //             if (activeLeadTasks.has(t.leadId)) {
        //                 const existing = activeLeadTasks.get(t.leadId);
        //                 // Keep the one with the latest dueDate
        //                 if (new Date(t.dueDate) >= new Date(existing.dueDate)) {
        //                     tasksToCloseIds.push(existing.id);
        //                     activeLeadTasks.set(t.leadId, t);
        //                 } else {
        //                     tasksToCloseIds.push(t.id);
        //                 }
        //             } else {
        //                 activeLeadTasks.set(t.leadId, t);
        //             }
        //         }
        //     }
        // });
        //
        // if (tasksToCloseIds.length > 0) {
        //     console.log(`[Self-Healing] Closing ${tasksToCloseIds.length} redundant tasks:`, tasksToCloseIds);
        //     // await Task.update({ status: 'done' }, { where: { id: { [Op.in]: tasksToCloseIds } } });
        //     // Filter out the ones we just closed from the response array
        //     // tasks = tasks.filter(t => !tasksToCloseIds.includes(t.id));
        // }

        // --- Role-Based Filtering for Commercial (REMOVED: Use frontend filters) ---
        // if ([ROLE_IDS.LEADER_SALES, ROLE_IDS.CONSULTANT].includes(roleId)) {
        //     // "Mostre as tarefas apenas dos leads ativos para o comercial."
        //     tasks = tasks.filter(t => {
        //         if (!t.leadId) return true; // Generic tasks? or pedagogical?
        //         if (t.Lead && ['won', 'closed'].includes(t.Lead.status)) return false;
        //         return true;
        //     });
        // }

        // --- Virtual Tasks (Classes & Mentorships) ---
        // Fetch classes and mentorships - ONLY current + next session per class

        // 1. Classes - Show Backlog & Today (pending), Hide Future
        const today = new Date().toISOString().split('T')[0];
        const classWhere = {
            [Op.or]: [
                {
                    status: 'scheduled',
                    date: { [Op.lte]: today } // Show only if date is today or past
                },
                {
                    status: 'completed',
                    date: { [Op.gte]: today } // Show recently completed (today+)
                }
            ]
        };

        if (isGlobalUser) {
            if (queryUnitId) classWhere['$Class.unitId$'] = queryUnitId;
        } else if (unitId) {
            classWhere['$Class.unitId$'] = unitId;
        }

        if (roleId === ROLE_IDS.INSTRUCTOR) classWhere['$Class.professorId$'] = id;

        // CONSULTANTS should NOT see Classes or Mentorships
        const isConsultantRef = Number(roleId) === ROLE_IDS.CONSULTANT;

        if (!isConsultantRef) {
            const sessions = await ClassSession.findAll({
                where: classWhere,
                order: [['date', 'ASC'], ['startTime', 'ASC']],
                include: [
                    {
                        model: Class,
                        include: [Course, { model: User, as: 'professor' }]
                    },
                    {
                        model: Module,
                        attributes: ['id', 'title', 'order']
                    }
                ]
            });

            // Group by classId
            // Logic: All returned sessions are now relevant (past/today pending), so show all.
            const sessionsByClass = {};
            sessions.forEach(s => {
                if (!s.Class || !s.Class.Course) return; // Skip orphans
                const cid = s.classId;
                if (!sessionsByClass[cid]) sessionsByClass[cid] = [];
                sessionsByClass[cid].push(s);
            });

            // Flatten & build virtual tasks
            Object.values(sessionsByClass).flat().forEach(s => {
                // Build a valid dueDate string
                const sessionDate = s.date || today;
                const rawTime = s.startTime || '09:00';
                // Normalize time to HH:mm:ss (some entries are HH:mm, others HH:mm:ss)
                const sessionTime = rawTime.split(':').length >= 3 ? rawTime : `${rawTime}:00`;
                const dueDate = `${sessionDate}T${sessionTime}`;

                // Build description from Module data (lesson number + name)
                const moduleOrder = s.Module?.order || s.sessionNumber;
                const moduleName = s.Module?.title || s.topic;
                const aulaLabel = moduleOrder ? `Aula ${moduleOrder}` : 'Aula';
                const namePart = moduleName ? `: ${moduleName}` : '';
                const profPart = `Prof: ${s.Class?.professor?.name || 'Não definido'}`;

                tasks.push({
                    id: `session-${s.id}`,
                    title: `Aula: ${s.Class?.Course?.name || 'Curso'} - ${s.Class?.name || 'Turma'}`,
                    description: `${aulaLabel}${namePart} | ${profPart}`,
                    dueDate,
                    status: s.status === 'completed' ? 'done' : 'pending',
                    priority: 'high',
                    category: 'pedagogical',
                    link: '/pedagogical',
                    state: { subTab: 'attendance', classId: s.classId, date: s.date },
                    unitId: s.Class?.unitId,
                    User: {
                        name: s.Class?.professor?.name || 'Professor',
                        roleId: s.Class?.professor?.roleId || 51
                    },
                    responsible: s.Class?.professor?.name || 'Professor',
                    responsibleRoleId: s.Class?.professor?.roleId || 51
                });
            });
        }

        // 2. Mentorships
        const mentWhere = { status: 'scheduled' };

        // Apply Date Filter to Mentorships
        // Mentorship uses 'scheduledDate' which is DATETIME. Dates in query are usually YYYY-MM-DD strings.
        if (start && end) {
            mentWhere.scheduledDate = { [Op.between]: [`${start}T00:00:00`, `${end}T23:59:59`] };
        } else if (start) {
            mentWhere.scheduledDate = { [Op.gte]: `${start}T00:00:00` };
        } else {
            const today = new Date().toISOString().split('T')[0];
            mentWhere.scheduledDate = { [Op.between]: [`${today}T00:00:00`, `${today}T23:59:59`] };
        }

        if (isGlobalUser) {
            if (queryUnitId) mentWhere['$Student.unitId$'] = queryUnitId;
        } else if (unitId) {
            mentWhere['$Student.unitId$'] = unitId;
        }

        if (!isConsultantRef) {
            const mentorships = await Mentorship.findAll({
                where: mentWhere,
                include: [
                    { model: Student, attributes: ['id', 'name', 'unitId'] },
                    { model: User, as: 'mentor', attributes: ['id', 'name'] }
                ]
            });

            mentorships.forEach(m => {
                if (!m.Student) return; // Skip orphans
                tasks.push({
                    id: `mentorship-${m.id}`,
                    title: `Mentoria: ${m.Student.name?.split(' ').slice(0, 2).join(' ') || 'Aluno'}`,
                    description: m.notes || 'Sem observações',
                    dueDate: m.scheduledDate,
                    status: 'pending',
                    priority: 'medium',
                    category: 'pedagogical',
                    link: '/pedagogical/mentorships',
                    User: {
                        name: m.mentor?.name || 'Professor',
                        roleId: 51
                    },
                    responsible: m.mentor?.name || 'Professor',
                    responsibleRoleId: 51
                });
            });
        }

        if (req.query.summary === 'true') {
            const pendingCount = tasks.filter(t => t.status === 'pending').length;
            const overdueCount = tasks.filter(t => t.status === 'pending' && new Date(t.dueDate) < new Date()).length;
            return res.json({ count: pendingCount, overdue: overdueCount, total: tasks.length });
        }

        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Criar nova tarefa
router.post('/', auth, async (req, res) => {
    try {
        const { unitId, role } = req.user;
        const taskData = { ...req.body };
        const isGlobalUser = ['master', 'diretor'].includes(String(role).toLowerCase());

        if (!isGlobalUser) {
            taskData.unitId = unitId;
        } else if (!taskData.unitId) {
            // Master can specify unitId, or defaults to null (Global)?
            // Maybe default to null if not provided
        }

        // Rule: Only one active task per lead. Close ALL previous ones regardless of category.
        if (taskData.leadId) {
            await Task.update(
                { status: 'done' },
                {
                    where: {
                        leadId: taskData.leadId,
                        status: 'pending'
                    }
                }
            );
        }

        const task = await Task.create(taskData);
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Atualizar tarefa
router.put('/:id', auth, async (req, res) => {
    try {
        const { id: taskId } = req.params;
        const task = await Task.findByPk(taskId);
        if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });

        if (!checkUnitIsolation(res, req.user, task.unitId)) return;

        await task.update(req.body);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Deletar tarefa
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id: taskId } = req.params;
        const task = await Task.findByPk(taskId);
        if (!task) return res.status(404).json({ error: 'Tarefa não encontrada' });

        if (!checkUnitIsolation(res, req.user, task.unitId)) return;

        await task.destroy();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Gerar tarefas de engajamento de alunos para dias de aula
router.post('/generate-engagement', auth, async (req, res) => {
    try {
        const { generateEngagementTasks } = require('../services/engagementTasks');

        const result = await generateEngagementTasks();

        res.json({
            success: true,
            message: `${result.tasksCreated} tarefas de engajamento criadas com sucesso!`,
            ...result
        });
    } catch (error) {
        console.error('Erro ao gerar tarefas de engajamento:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
