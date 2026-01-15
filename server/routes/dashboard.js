const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Class = require('../models/Class');
const Course = require('../models/Course');
const FinancialRecord = require('../models/FinancialRecord');
const Lead = require('../models/Lead');
const User = require('../models/User');
const Unit = require('../models/Unit');
const Task = require('../models/Task');
const Enrollment = require('../models/Enrollment');
const Attendance = require('../models/Attendance');
const Mentorship = require('../models/Mentorship');
const { Op, Sequelize } = require('sequelize');
const auth = require('../middleware/auth');
const { ROLE_IDS, ROLES_MAP } = require('../config/roles');

// Helper for Hash ID (Consistent with classes.js)
const getNumericId = (id) => {
    if (!id) return null;
    if (!isNaN(Number(id))) return Number(id);
    let hash = 0;
    const str = String(id);
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
    return Math.abs(hash);
};

// GET /dashboard/main-stats
router.get('/main-stats', auth, async (req, res) => {
    try {
        const { unitId, startDate, endDate } = req.query;
        const requester = req.user;
        const isGlobal = [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(Number(requester.roleId));

        let finalUnitId = unitId;
        if (!isGlobal) {
            finalUnitId = requester.unitId;
        }

        // Logic: Use getNumericId for safety
        const numericUnitId = finalUnitId ? getNumericId(finalUnitId) : null;

        // Build scope
        const scope = {};
        if (numericUnitId && finalUnitId !== 'all') {
            scope.unitId = numericUnitId;
        } else if (!isGlobal) {
            // Non-global must have a unit ID
            if (requester.unitId) {
                const fallbackId = getNumericId(requester.unitId);
                if (fallbackId) scope.unitId = fallbackId;
                else scope.unitId = -1; // Invalid user unit
            } else {
                scope.unitId = -1; // No unit
            }
        }

        const now = new Date();
        let startPeriod, endPeriod;

        if (startDate && endDate) {
            startPeriod = new Date(startDate);
            endPeriod = new Date(endDate);
            // Ensure full day coverage if time is not provided
            if (startDate.length === 10) startPeriod.setHours(0, 0, 0, 0);
            if (endDate.length === 10) endPeriod.setHours(23, 59, 59, 999);
        } else {
            // Default: Current Month
            startPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
            endPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        }

        // Previous Month Dates (Fixed as Previous Month for baseline comparison, or could be dynamic previous period)
        // For simplicity and consistency with existing frontend labels ("Last Month"), keeping it as Last Calendar Month.
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        const leadScope = {
            ...scope,
            status: { [Op.notIn]: ['internal_other', 'internal_team'] }
        };

        // --- PARALLEL DATA FETCHING ---
        const [
            units,
            totalLeads,
            newLeadsMonth,
            salesMonth,
            newLeadsLastMonth,
            salesLastMonth,
            consultants,
            revenue,
            expense,
            activeStudents,
            activeClasses,
            plannedClasses,
            pendingContracts,
            startedClasses,
            finishedClasses,
            graduatedStudents,
            completedMentorships,
            scheduledMentorships,
            presentAttendance,
            totalAttendance,
            scheduledPeriod,
            unitGoalSum,
            cancelledPeriod,
            lockedPeriod,
            coffeeExpenses,
            callsCount,
            lostLeadsCount,
            studentsForRiskList
        ] = await Promise.all([
            isGlobal ? Unit.findAll({ attributes: ['id', 'name'], order: [['name', 'ASC']] }) : Unit.findAll({ where: { id: requester.unitId }, attributes: ['id', 'name'] }),
            Lead.count({ where: { ...leadScope } }),
            Lead.count({ where: { ...leadScope, createdAt: { [Op.gte]: startPeriod, [Op.lte]: endPeriod } } }),
            Lead.count({ where: { ...scope, status: 'won', updatedAt: { [Op.gte]: startPeriod, [Op.lte]: endPeriod } } }), // specific status overrides
            Lead.count({ where: { ...leadScope, createdAt: { [Op.between]: [startOfLastMonth, endOfLastMonth] } } }),
            Lead.count({ where: { ...scope, status: 'won', updatedAt: { [Op.between]: [startOfLastMonth, endOfLastMonth] } } }),
            // Buscar todos os usuários com roles de vendas (Consultor, SDR, Closer, etc.)
            User.findAll({
                where: {
                    roleId: {
                        [Op.in]: [
                            ROLE_IDS.CONSULTANT,      // 41 - Consultor
                            ROLE_IDS.SDR,             // 20 - SDR
                            ROLE_IDS.CLOSER,          // 42 - Closer (se existir)
                            ROLE_IDS.LEADER_SALES     // 30 - Líder de Vendas
                        ]
                    },
                    ...scope
                },
                include: [{ model: Unit, attributes: ['name'] }],
                attributes: ['id', 'name', 'avatar', 'roleId', 'unitId', 'goal']
            }),
            FinancialRecord.sum('amount', { where: { ...scope, direction: 'income', status: 'paid', paymentDate: { [Op.between]: [startPeriod, endPeriod] } } }),
            FinancialRecord.sum('amount', { where: { ...scope, direction: 'expense', status: 'paid', paymentDate: { [Op.between]: [startPeriod, endPeriod] } } }),
            Student.count({ where: { ...scope, status: 'active' } }),
            Class.count({ where: { ...scope, status: 'active' } }),
            Class.count({ where: { ...scope, status: 'planned' } }),
            Student.count({ where: { ...scope, contractStatus: 'pending' } }),
            Class.count({ where: { ...scope, startDate: { [Op.between]: [startPeriod, endPeriod] } } }),
            Class.count({ where: { ...scope, endDate: { [Op.between]: [startPeriod, endPeriod] }, status: 'finished' } }),
            Student.count({ where: { ...scope, status: 'completed', updatedAt: { [Op.between]: [startPeriod, endPeriod] } } }),

            // Mentorships (Filter via Student)
            Mentorship.count({
                where: { status: 'completed', scheduledDate: { [Op.between]: [startPeriod, endPeriod] } },
                include: [{ model: Student, where: scope, required: true }]
            }),
            Mentorship.count({
                where: { status: 'scheduled', scheduledDate: { [Op.between]: [startPeriod, endPeriod] } },
                include: [{ model: Student, where: scope, required: true }]
            }),

            // Attendance (Filter via Student)
            Attendance.count({
                where: { present: true, date: { [Op.between]: [startPeriod, endPeriod.toISOString().split('T')[0]] } },
                include: [{ model: Student, where: scope, required: true }]
            }),
            Attendance.count({
                where: { date: { [Op.between]: [startPeriod, endPeriod.toISOString().split('T')[0]] } },
                include: [{ model: Student, where: scope, required: true }]
            }),

            Lead.count({ where: { ...scope, status: 'scheduled', updatedAt: { [Op.between]: [startPeriod, endPeriod] } } }),
            User.sum('goal', { where: { roleId: ROLE_IDS.CONSULTANT, ...scope } }),
            Student.count({ where: { ...scope, status: 'cancelled', updatedAt: { [Op.between]: [startPeriod, endPeriod] } } }),
            Student.count({ where: { ...scope, status: 'locked', updatedAt: { [Op.between]: [startPeriod, endPeriod] } } }),
            FinancialRecord.sum('amount', {
                where: {
                    ...scope,
                    direction: 'expense',
                    status: 'paid',
                    paymentDate: { [Op.between]: [startPeriod, endPeriod] },
                    [Op.or]: [
                        { description: { [Op.like]: '%coffee%' } },
                        { category: { [Op.like]: '%coffee%' } },
                        { description: { [Op.like]: '%café%' } },
                        { category: { [Op.like]: '%café%' } },
                        { description: { [Op.like]: '%lanche%' } },
                        { category: { [Op.like]: '%lanche%' } }
                    ]
                }
            }),
            Task.count({ where: { ...scope, status: 'done', updatedAt: { [Op.between]: [startPeriod, endPeriod] } } }),
            Lead.count({ where: { ...scope, status: 'lost', updatedAt: { [Op.between]: [startPeriod, endPeriod] } } }),
            // Fetch Active Students with Attendance for Risk Calculation
            Student.findAll({
                where: { ...scope, status: 'active' },
                include: [{ model: Attendance, attributes: ['present'] }],
                attributes: ['id', 'status', 'paymentStatus']
            })
        ]);

        const consultantIds = consultants.map(c => c.id);

        // Calculate At Risk Count
        // Risk = Payment Late OR Attendance < 75%
        let atRiskCount = 0;
        if (studentsForRiskList && Array.isArray(studentsForRiskList)) {
            atRiskCount = studentsForRiskList.reduce((count, student) => {
                const isLate = student.paymentStatus === 'late';

                const attendances = student.Attendances || [];
                const totalClasses = attendances.length;
                let attendanceRate = 1.0; // Default 100% if no classes

                if (totalClasses > 0) {
                    const presentCount = attendances.filter(a => a.present).length;
                    attendanceRate = presentCount / totalClasses;
                }

                // Risk Condition: Late Payment OR Attendance < 75%
                if (isLate || attendanceRate < 0.75) {
                    return count + 1;
                }
                return count;
            }, 0);
        }


        // Fetch Performance Data in Parallel (Part 2)
        const [leadCounts, overdueTaskCounts] = await Promise.all([
            Lead.findAll({
                where: {
                    consultant_id: consultantIds,
                    [Op.or]: [
                        // Active Portfolio (Any Date)
                        { status: { [Op.notIn]: ['closed', 'archived', 'lost', 'won', 'internal_team', 'internal_other'] } },
                        // Won in Period
                        { status: 'won', updatedAt: { [Op.gte]: startPeriod, [Op.lte]: endPeriod } }
                    ]
                },
                attributes: ['consultant_id', 'status', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
                group: ['consultant_id', 'status']
            }),
            Task.findAll({
                where: {
                    userId: consultantIds,
                    status: { [Op.ne]: 'done' },
                    dueDate: { [Op.lt]: new Date() }
                },
                attributes: ['userId', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
                group: ['userId']
            })
        ]);

        // --- CALCULATION LOGIC ---
        const conversionRate = newLeadsMonth > 0 ? ((salesMonth / newLeadsMonth) * 100).toFixed(1) : (0).toFixed(1);
        const conversionRateLastMonth = newLeadsLastMonth > 0 ? ((salesLastMonth / newLeadsLastMonth) * 100).toFixed(1) : (0).toFixed(1);

        const leadMap = {};
        leadCounts.forEach(lc => {
            const cid = lc.consultant_id;
            const status = lc.status;
            const count = parseInt(lc.get('count'));
            if (!leadMap[cid]) leadMap[cid] = {};
            leadMap[cid][status] = (leadMap[cid][status] || 0) + count;
        });

        const overdueMap = {};
        overdueTaskCounts.forEach(ot => {
            overdueMap[ot.userId] = parseInt(ot.get('count'));
        });

        const allPerformance = consultants.map(user => {
            const myLeads = leadMap[user.id] || {};
            const won = myLeads.won || 0;
            const created = myLeads.new || 0; // Or sum all if needed, but 'new' in period is standard
            const totalLeads = Object.values(myLeads).reduce((a, b) => a + b, 0);
            const scheduled = myLeads.scheduled || 0;
            const convRate = totalLeads > 0 ? ((won / totalLeads) * 100).toFixed(1) : "0.0";

            // Usar meta do usuário ou padrão
            const goal = user.goal || 10;
            return {
                id: user.id,
                name: user.name,
                avatar: user.avatar,
                role: ROLES_MAP[user.roleId] || user.role || 'Vendedor',
                unit: user.Unit?.name || user.unit || 'Matriz',
                sales: won,
                meetings: scheduled,
                totalLeads: totalLeads,
                conversionRate: convRate,
                goal,
                progress: Math.min((won / goal) * 100, 100).toFixed(0),
                breakdown: {
                    new: myLeads.new || 0,
                    connecting: (myLeads.connecting || 0) + (myLeads.connected || 0),
                    scheduled: scheduled,
                    negotiation: myLeads.negotiation || 0,
                    won: won
                },
                overdueTasks: overdueMap[user.id] || 0
            };
        });

        // Ordenar TODOS os vendedores por vendas (maior primeiro), depois por leads
        const teamPerformanceAll = allPerformance
            .sort((a, b) => {
                // 1º critério: vendas (mais importante)
                if (b.sales !== a.sales) return b.sales - a.sales;
                // 2º critério: total de leads
                if (b.totalLeads !== a.totalLeads) return b.totalLeads - a.totalLeads;
                // 3º critério: taxa de conversão
                return parseFloat(b.conversionRate) - parseFloat(a.conversionRate);
            })
            .map((seller, index) => ({
                ...seller,
                ranking: index + 1  // Posição no ranking geral
            }));

        // Top 5 para exibição principal (destaques)
        const teamPerformanceTop = teamPerformanceAll.slice(0, 5);

        const revenueVal = revenue || 0;
        const expenseVal = expense || 0;

        const attendanceRate = totalAttendance > 0 ? ((presentAttendance / totalAttendance) * 100).toFixed(1) : "0.0";
        const mentorshipRate = activeStudents > 0 ? (completedMentorships / activeStudents).toFixed(2) : "0.0";

        const globalGoal = unitGoalSum || 30;
        const goalProgress = globalGoal > 0 ? ((salesMonth / globalGoal) * 100).toFixed(0) : 0;

        res.json({
            units,
            selectedUnit: unitId || 'all',
            commercial: {
                leads: newLeadsMonth,
                appointments: scheduledPeriod,
                sales: salesMonth,
                conversionRate: `${conversionRate}%`,
                goal: globalGoal,
                goalReached: salesMonth,
                goalProgress: `${goalProgress}%`,
                callsCount,
                lostLeadsCount,
                teamPerformance: teamPerformanceTop,  // Top 5 destaques
                totalSellers: teamPerformanceAll.length  // Total de vendedores no ranking
            },
            financial: {
                income: revenueVal,
                expense: expenseVal,
                revenue: revenueVal,
                cashFlow: (revenueVal - expenseVal),
                costPerStudent: activeStudents > 0 ? (expenseVal / activeStudents).toFixed(2) : 0,
                coffeePerStudent: activeStudents > 0 ? ((coffeeExpenses || 0) / activeStudents).toFixed(2) : 0
            },
            pedagogical: {
                activeStudents,
                activeClasses,
                startedClasses,
                finishedClasses,
                graduatedStudents,
                completedMentorships,
                scheduledMentorships,
                attendanceRate: `${attendanceRate}%`,
                atRisk: atRiskCount,
                mentorshipRate
            },
            administrative: {
                plannedClasses,
                pendingContracts,
                cancellationRate: activeStudents > 0 ? ((cancelledPeriod / activeStudents) * 100).toFixed(1) + '%' : '0.0%',
                evasionRate: activeStudents > 0 ? (((cancelledPeriod * 0.4) / activeStudents) * 100).toFixed(1) + '%' : '0.0%',
                lockRate: activeStudents > 0 ? ((lockedPeriod / activeStudents) * 100).toFixed(1) + '%' : '0.0%'
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Novo endpoint para listar todos os vendedores com paginação
// GET /dashboard/sales-ranking
router.get('/sales-ranking', auth, async (req, res) => {
    try {
        const { unitId, startDate, endDate, page = 1, limit = 20 } = req.query;
        const requester = req.user;
        const isGlobal = [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(Number(requester.roleId));

        let finalUnitId = unitId;
        if (!isGlobal) {
            finalUnitId = requester.unitId;
        }

        const numericUnitId = finalUnitId ? getNumericId(finalUnitId) : null;

        const scope = {};
        if (numericUnitId && finalUnitId !== 'all') {
            scope.unitId = numericUnitId;
        } else if (!isGlobal) {
            const fallbackId = requester.unitId ? getNumericId(requester.unitId) : null;
            scope.unitId = fallbackId || -1;
        }

        const now = new Date();
        let startPeriod, endPeriod;

        if (startDate && endDate) {
            startPeriod = new Date(startDate);
            endPeriod = new Date(endDate);
            if (startDate.length === 10) startPeriod.setHours(0, 0, 0, 0);
            if (endDate.length === 10) endPeriod.setHours(23, 59, 59, 999);
        } else {
            startPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
            endPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        }

        // Buscar todos os vendedores
        const consultants = await User.findAll({
            where: {
                roleId: {
                    [Op.in]: [
                        ROLE_IDS.CONSULTANT,
                        ROLE_IDS.SDR,
                        ROLE_IDS.CLOSER,
                        ROLE_IDS.LEADER_SALES
                    ]
                },
                ...scope
            },
            include: [{ model: Unit, attributes: ['name'] }],
            attributes: ['id', 'name', 'avatar', 'roleId', 'unitId', 'goal']
        });

        const consultantIds = consultants.map(c => c.id);

        // Buscar leads e tasks
        const [leadCounts, overdueTaskCounts] = await Promise.all([
            Lead.findAll({
                where: {
                    consultant_id: consultantIds,
                    [Op.or]: [
                        { status: { [Op.notIn]: ['closed', 'archived', 'lost', 'won', 'internal_team', 'internal_other'] } },
                        { status: 'won', updatedAt: { [Op.gte]: startPeriod, [Op.lte]: endPeriod } }
                    ]
                },
                attributes: ['consultant_id', 'status', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
                group: ['consultant_id', 'status']
            }),
            Task.findAll({
                where: {
                    userId: consultantIds,
                    status: { [Op.ne]: 'done' },
                    dueDate: { [Op.lt]: new Date() }
                },
                attributes: ['userId', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
                group: ['userId']
            })
        ]);

        const leadMap = {};
        leadCounts.forEach(lc => {
            const cid = lc.consultant_id;
            const status = lc.status;
            const count = parseInt(lc.get('count'));
            if (!leadMap[cid]) leadMap[cid] = {};
            leadMap[cid][status] = (leadMap[cid][status] || 0) + count;
        });

        const overdueMap = {};
        overdueTaskCounts.forEach(ot => {
            overdueMap[ot.userId] = parseInt(ot.get('count'));
        });

        // Calcular performance de todos
        const allPerformance = consultants.map(user => {
            const myLeads = leadMap[user.id] || {};
            const won = myLeads.won || 0;
            const totalLeads = Object.values(myLeads).reduce((a, b) => a + b, 0);
            const scheduled = myLeads.scheduled || 0;
            const convRate = totalLeads > 0 ? ((won / totalLeads) * 100).toFixed(1) : "0.0";
            const goal = user.goal || 10;

            return {
                id: user.id,
                name: user.name,
                avatar: user.avatar,
                role: ROLES_MAP[user.roleId] || user.role || 'Vendedor',
                unit: user.Unit?.name || user.unit || 'Matriz',
                sales: won,
                meetings: scheduled,
                totalLeads: totalLeads,
                conversionRate: convRate,
                goal,
                progress: Math.min((won / goal) * 100, 100).toFixed(0),
                breakdown: {
                    new: myLeads.new || 0,
                    connecting: (myLeads.connecting || 0) + (myLeads.connected || 0),
                    scheduled: scheduled,
                    negotiation: myLeads.negotiation || 0,
                    won: won
                },
                overdueTasks: overdueMap[user.id] || 0
            };
        });

        // Ordenar por vendas, depois por leads, depois por conversão
        const sortedPerformance = allPerformance
            .sort((a, b) => {
                if (b.sales !== a.sales) return b.sales - a.sales;
                if (b.totalLeads !== a.totalLeads) return b.totalLeads - a.totalLeads;
                return parseFloat(b.conversionRate) - parseFloat(a.conversionRate);
            })
            .map((seller, index) => ({
                ...seller,
                ranking: index + 1
            }));

        // Paginação
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;

        const paginatedData = sortedPerformance.slice(startIndex, endIndex);
        const totalPages = Math.ceil(sortedPerformance.length / limitNum);

        res.json({
            data: paginatedData,
            pagination: {
                currentPage: pageNum,
                totalPages: totalPages,
                totalItems: sortedPerformance.length,
                itemsPerPage: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});
// GET /dashboard/admin-stats
router.get('/admin-stats', auth, async (req, res) => {
    try {
        const { unitId, startDate, endDate, period } = req.query;
        const requester = req.user;
        const isGlobal = [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(Number(requester.roleId));

        let finalUnitId = unitId;
        if (!isGlobal) finalUnitId = requester.unitId;

        const numericUnitId = finalUnitId ? getNumericId(finalUnitId) : null;

        const scope = {};
        if (numericUnitId && finalUnitId !== 'all') {
            scope.unitId = numericUnitId;
        } else if (!isGlobal) {
            const fallbackId = requester.unitId ? getNumericId(requester.unitId) : null;
            scope.unitId = fallbackId || -1;
        }

        let startPeriod, endPeriod;
        const now = new Date();

        if (startDate && endDate) {
            startPeriod = new Date(startDate);
            endPeriod = new Date(endDate);
        } else if (period) {
            switch (period) {
                case 'day':
                    startPeriod = new Date(now.setHours(0, 0, 0, 0));
                    endPeriod = new Date(now.setHours(23, 59, 59, 999));
                    break;
                case 'week':
                    const first = now.getDate() - now.getDay();
                    startPeriod = new Date(now.setDate(first));
                    startPeriod.setHours(0, 0, 0, 0);
                    endPeriod = new Date();
                    endPeriod.setHours(23, 59, 59, 999);
                    break;
                case 'year':
                    startPeriod = new Date(now.getFullYear(), 0, 1);
                    endPeriod = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
                    break;
                default: // month
                    startPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
                    endPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
            }
        } else {
            startPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
            endPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        }

        const [activeStudents, activeClasses, plannedClasses, pendingContracts, startedClasses, finishedClasses, cancelledCount, lockedCount] = await Promise.all([
            Student.count({ where: { ...scope, status: 'active' } }),
            Class.count({ where: { ...scope, status: 'active' } }),
            Class.count({ where: { ...scope, status: 'planned' } }),
            Student.count({ where: { ...scope, contractStatus: 'pending' } }),
            Class.count({ where: { ...scope, startDate: { [Op.between]: [startPeriod, endPeriod] } } }),
            Class.count({ where: { ...scope, endDate: { [Op.between]: [startPeriod, endPeriod] }, status: 'finished' } }),
            Student.count({ where: { ...scope, status: 'cancelled', updatedAt: { [Op.between]: [startPeriod, endPeriod] } } }),
            Student.count({ where: { ...scope, status: 'locked', updatedAt: { [Op.between]: [startPeriod, endPeriod] } } })
        ]);

        const cancellationRate = activeStudents > 0 ? ((cancelledCount / activeStudents) * 100).toFixed(1) + '%' : '0.0%';
        const evasionRate = activeStudents > 0 ? (((cancelledCount * 0.4) / activeStudents) * 100).toFixed(1) + '%' : '0.0%';
        const lockRate = activeStudents > 0 ? ((lockedCount / activeStudents) * 100).toFixed(1) + '%' : '0.0%';

        // Grouping logic for more detail using more robust Sequelize syntax
        const [activeStudentsByCourse, activeClassesByCourse] = await Promise.all([
            Student.findAll({
                where: { ...scope, status: 'active' },
                include: [{ model: Course, attributes: ['name'] }],
                attributes: [
                    'courseId',
                    [Sequelize.literal('COUNT(*)'), 'total']
                ],
                group: ['courseId', 'Course.id', 'Course.name'],
                raw: true
            }),
            Class.findAll({
                where: { ...scope, status: 'active' },
                include: [{ model: Course, attributes: ['name'] }],
                attributes: [
                    'courseId',
                    [Sequelize.literal('COUNT(*)'), 'total']
                ],
                group: ['courseId', 'Course.id', 'Course.name'],
                raw: true
            })
        ]);

        const studentsByCourse = {};
        activeStudentsByCourse.forEach(item => {
            const label = item['Course.name'] || item.Course?.name || 'Geral';
            studentsByCourse[label] = parseInt(item.total || 0);
        });

        const classesByCourse = {};
        activeClassesByCourse.forEach(item => {
            const label = item['Course.name'] || item.Course?.name || 'Geral';
            classesByCourse[label] = parseInt(item.total || 0);
        });

        res.json({
            pedagogical: {
                activeStudents,
                activeClasses,
                activeStudentsByCourse: studentsByCourse,
                activeClassesByCourse: classesByCourse,
                startedClasses,
                finishedClasses
            },
            administrative: {
                plannedClasses,
                pendingContracts,
                cancellationRate,
                evasionRate,
                lockRate
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /dashboard/admin-charts
router.get('/admin-charts', auth, async (req, res) => {
    try {
        const { unitId } = req.query;
        const requester = req.user;
        const isGlobal = [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(Number(requester.roleId));

        let finalUnitId = unitId;
        if (!isGlobal) finalUnitId = requester.unitId;

        // Logic: Use getNumericId for safety
        const numericUnitId = finalUnitId ? getNumericId(finalUnitId) : null;

        const scope = {};
        if (numericUnitId && finalUnitId !== 'all') {
            scope.unitId = numericUnitId;
        } else if (!isGlobal) {
            const fallbackId = requester.unitId ? getNumericId(requester.unitId) : null;
            scope.unitId = fallbackId || -1;
        }

        const students = await Student.findAll({ where: scope });

        // Gender Distribution
        const genderCounts = students.reduce((acc, s) => {
            const g = s.gender || 'Não Informado';
            acc[g] = (acc[g] || 0) + 1;
            return acc;
        }, {});
        const genderData = Object.keys(genderCounts).map(name => ({ name, value: genderCounts[name] }));

        // Age Analysis
        const ageData = [
            { name: '0-12', value: 0 },
            { name: '13-17', value: 0 },
            { name: '18-24', value: 0 },
            { name: '25-34', value: 0 },
            { name: '35-44', value: 0 },
            { name: '45+', value: 0 }
        ];
        students.forEach(s => {
            if (!s.birthDate) return;
            const age = new Date().getFullYear() - new Date(s.birthDate).getFullYear();
            if (age <= 12) ageData[0].value++;
            else if (age <= 17) ageData[1].value++;
            else if (age <= 24) ageData[2].value++;
            else if (age <= 34) ageData[3].value++;
            else if (age <= 44) ageData[4].value++;
            else ageData[5].value++;
        });

        // Neighborhood (Top 10)
        const neighborhoodCounts = students.reduce((acc, s) => {
            if (s.neighborhood) acc[s.neighborhood] = (acc[s.neighborhood] || 0) + 1;
            return acc;
        }, {});
        const neighborhoodData = Object.keys(neighborhoodCounts)
            .map(name => ({ name, value: neighborhoodCounts[name] }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        // Course Distribution
        const [courseCountsRaw] = await Promise.all([
            Student.findAll({
                where: scope,
                include: [{ model: Course, attributes: ['name'] }],
                attributes: [
                    'courseId',
                    [Sequelize.literal('COUNT(*)'), 'total']
                ],
                group: ['courseId', 'Course.id', 'Course.name'],
                raw: true
            })
        ]);

        const courseData = courseCountsRaw.map(item => ({
            name: item['Course.name'] || item.Course?.name || 'Geral',
            value: parseInt(item.total || 0)
        }));

        res.json({ genderData, ageData, neighborhoodData, courseData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /dashboard/financial-stats
router.get('/financial-stats', auth, async (req, res) => {
    try {
        const { unitId, roleId } = req.user;
        const isGlobal = [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(Number(roleId));
        const where = {};
        if (!isGlobal) where.unitId = unitId;

        const activeRec = await FinancialRecord.findAll({
            where,
            limit: 5,
            order: [['createdAt', 'DESC']]
        });
        res.json({ recent: activeRec });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// GET /dashboard/my-stats
router.get('/my-stats', auth, async (req, res) => {
    try {
        const requester = req.user;
        const userId = requester.id;
        const { startDate: qStartDate, endDate: qEndDate, period = 'month' } = req.query;

        const now = new Date();
        let startDate, endDate;

        if (qStartDate && qEndDate) {
            startDate = new Date(qStartDate);
            if (qStartDate.length === 10) startDate.setHours(0, 0, 0, 0);

            endDate = new Date(qEndDate);
            if (qEndDate.length === 10) endDate.setHours(23, 59, 59, 999);
        } else if (period === 'day') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        } else if (period === 'week') {
            const day = now.getDay();
            const diff = now.getDate() - day;
            startDate = new Date(now.setDate(diff));
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now.setDate(diff + 6));
            endDate.setHours(23, 59, 59, 999);
        } else if (period === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        } else {
            // Month
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        }

        const user = await User.findByPk(userId);
        const goal = user?.goal || 10;

        console.log(`[DASHBOARD DEBUG] /my-stats Request for User ID: ${userId}, Role: ${requester.roleId}, Unit: ${requester.unitId}. Query Unit: ${req.query.unitId}`);

        const isGlobal = [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(Number(requester.roleId));
        let classUnitFilter = {};

        if (isGlobal) {
            // If Global, respect the query filter. 
            if (req.query.unitId && req.query.unitId !== 'all') {
                classUnitFilter.unitId = Number(req.query.unitId);
            }
            // If 'all' or undefined, no unitId filter (show all)
        } else {
            // Strict for non-global
            classUnitFilter.unitId = requester.unitId;
        }
        console.log(`[DASHBOARD DEBUG] Class Filter:`, JSON.stringify(classUnitFilter));

        const [
            salesPeriod,
            totalSales,
            revenuePeriod,
            forecastRevenue,
            appointmentsCount,
            allMyLeads,
            callsCount,
            lostLeadsCount,
            classesData,
            allConsultants
        ] = await Promise.all([
            Lead.count({ where: { consultant_id: userId, status: 'won', updatedAt: { [Op.between]: [startDate, endDate] } } }),
            Lead.count({ where: { consultant_id: userId, status: 'won' } }),
            Lead.sum('sales_value', { where: { consultant_id: userId, status: 'won', updatedAt: { [Op.between]: [startDate, endDate] } } }),
            Lead.sum('sales_value', { where: { consultant_id: userId, status: { [Op.notIn]: ['won', 'closed', 'lost'] } } }),
            Lead.count({ where: { consultant_id: userId, status: 'scheduled', updatedAt: { [Op.between]: [startDate, endDate] } } }),
            // CHANGED: Active Leads (Portfolio) - No date filter, only status. Excludes terminal states.
            Lead.count({
                where: {
                    consultant_id: userId,
                    status: { [Op.notIn]: ['closed', 'archived', 'lost', 'won', 'internal_team', 'internal_other'] }
                }
            }).then(c => { console.log(`DEBUG: User ${userId} Active Leads: ${c}`); return c; }),
            Task.count({ where: { userId, category: 'commercial', status: 'done', updatedAt: { [Op.between]: [startDate, endDate] } } }),
            Lead.count({ where: { consultant_id: userId, status: 'lost', updatedAt: { [Op.between]: [startDate, endDate] } } }),
            Class.findAll({
                where: {
                    ...classUnitFilter,
                    status: { [Op.in]: ['active', 'planned'] }
                },
                include: [
                    { model: Enrollment, attributes: ['id'] },
                    { model: Course, attributes: ['name'] },
                    { model: User, as: 'professor', attributes: ['name'] }
                ],
                order: [['startDate', 'ASC']]
            }),
            User.findAll({
                where: { [Op.or]: [{ roleId: ROLE_IDS.CONSULTANT }, { role: { [Op.like]: '%41%' } }] },
                include: [{ model: Unit, attributes: ['name'] }]
            })
        ]);

        const rankingData = await Promise.all(allConsultants.map(async (c) => {
            const count = await Lead.count({
                where: { consultant_id: c.id, status: 'won', updatedAt: { [Op.between]: [startDate, endDate] } }
            });
            return { id: c.id, sales: count };
        }));

        const classesWithVacancies = classesData.map(c => {
            const enrolled = c.Enrollments?.length || 0;
            return {
                id: c.id,
                name: c.name,
                courseName: c.Course?.name || 'Curso Geral',
                professorName: c.professor?.name || 'Sem Professor',
                startDate: c.startDate,
                endDate: c.endDate,
                status: c.status,
                capacity: c.capacity,
                enrolled: enrolled,
                vacancies: Math.max(0, c.capacity - enrolled)
            };
        });

        const sortedRanking = rankingData.sort((a, b) => b.sales - a.sales);
        const myPositionRede = sortedRanking.findIndex(r => r.id === userId) + 1;

        const unitConsultants = allConsultants.filter(c => c.unitId === requester.unitId);
        const unitRankingData = rankingData.filter(rd => unitConsultants.some(uc => uc.id === rd.id));
        const sortedUnitRanking = unitRankingData.sort((a, b) => b.sales - a.sales);
        const myPositionUnit = sortedUnitRanking.findIndex(r => r.id === userId) + 1;

        // Conversion Rate: Sales / (Sales + ActiveLeads + LostLeads[Period])? 
        // Simplest approximation for "Performance": Sales / (Active + Sales + Lost) creates a "Total Worked" denominator.
        // For now, let's keep it simple: Sales / Active (Pipeline Conversion Potential) or User's expectation.
        // If Active is 2 and Sales is 1, rate is 50%.
        // But if we use just Active (which doesn't include Won), we might get > 100% if we divide Sales/Active.
        // Let's use Denominator = Active + Sales (in period) + Lost (in period).
        // Or revert to New Leads? No, user wants transfer visibility.
        // Let's us Denom = allMyLeads + salesPeriod.
        const totalOpportunities = allMyLeads + salesPeriod + lostLeadsCount;
        const conversionRate = totalOpportunities > 0 ? ((salesPeriod / totalOpportunities) * 100).toFixed(1) : "0.0";
        const goalProgress = goal > 0 ? ((salesPeriod / goal) * 100).toFixed(0) : 0;

        console.log(`[DASHBOARD DEBUG] Result > Active Leads: ${allMyLeads}, Classes: ${classesWithVacancies.length}`);

        res.json({
            commercial: {
                leads: allMyLeads, // Now shows Active Portfolio Count
                appointments: appointmentsCount,
                sales: salesPeriod,
                conversionRate: `${conversionRate}%`,
                goal: goal,
                goalProgress: `${goalProgress}%`,
                revenueMonth: revenuePeriod || 0,
                callsCount,
                lostLeadsCount,
                totalSales
            },
            classes: classesWithVacancies
        });
    } catch (error) {
        console.error("My Stats Error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
