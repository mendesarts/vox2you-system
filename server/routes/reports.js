const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Class = require('../models/Class');
const Course = require('../models/Course');
const FinancialRecord = require('../models/FinancialRecord');
const auth = require('../middleware/auth');

/**
 * GET /api/reports/students-at-risk
 * Retorna alunos em risco (baixa frequência ou inadimplência)
 */
router.get('/students-at-risk', auth, async (req, res) => {
    try {
        const { unitId } = req.query;
        const userUnitId = req.user.unitId;

        // Filtro de unidade
        const whereClause = { status: 'active' };
        if (unitId && unitId !== 'all') {
            whereClause.unitId = unitId;
        } else if (userUnitId && ![1, 10].includes(req.user.roleId)) {
            whereClause.unitId = userUnitId;
        }

        // Buscar todos os alunos ativos
        const students = await Student.findAll({
            where: whereClause,
            include: [
                {
                    model: Class,
                    include: [{ model: Course }]
                }
            ]
        });

        const studentsAtRisk = [];

        for (const student of students) {
            const riskFactors = [];
            let riskLevel = 'low';

            // CRITÉRIO PRINCIPAL: Verificar faltas consecutivas (2 ou mais)
            const recentAttendances = await Attendance.findAll({
                where: { studentId: student.id },
                order: [['date', 'DESC']],
                limit: 10
            });

            let consecutiveAbsences = 0;
            for (const att of recentAttendances) {
                if (att.status === 'absent') {
                    consecutiveAbsences++;
                } else {
                    break;
                }
            }

            // ALERTA: 2 ou mais faltas consecutivas
            if (consecutiveAbsences >= 2) {
                riskFactors.push({
                    type: 'consecutive_absences',
                    severity: consecutiveAbsences >= 3 ? 'high' : 'medium',
                    description: `${consecutiveAbsences} faltas consecutivas`,
                    value: consecutiveAbsences
                });
                riskLevel = consecutiveAbsences >= 3 ? 'high' : 'medium';
            }

            // Verificar inadimplência
            const overduePayments = await FinancialRecord.count({
                where: {
                    studentId: student.id,
                    status: 'pending',
                    dueDate: { [Op.lt]: new Date() }
                }
            });

            if (overduePayments > 0) {
                const overdueAmount = await FinancialRecord.sum('amount', {
                    where: {
                        studentId: student.id,
                        status: 'pending',
                        dueDate: { [Op.lt]: new Date() }
                    }
                });

                riskFactors.push({
                    type: 'overdue_payments',
                    severity: overduePayments >= 3 ? 'high' : 'medium',
                    description: `${overduePayments} parcela(s) em atraso (R$ ${overdueAmount?.toFixed(2) || 0})`,
                    value: overduePayments,
                    amount: overdueAmount
                });
                if (overduePayments >= 3 && riskLevel !== 'high') riskLevel = 'medium';
            }

            // Verificar pagamento em dia
            if (student.paymentStatus === 'overdue') {
                riskFactors.push({
                    type: 'payment_status',
                    severity: 'medium',
                    description: 'Status de pagamento: Em atraso',
                    value: 'overdue'
                });
            }

            // Se houver algum fator de risco, adicionar à lista
            if (riskFactors.length > 0) {
                studentsAtRisk.push({
                    id: student.id,
                    name: student.name,
                    email: student.email,
                    phone: student.phone,
                    class: student.Class?.name,
                    course: student.Class?.Course?.name,
                    enrollmentDate: student.enrollmentDate,
                    riskLevel,
                    riskFactors,
                    totalRiskFactors: riskFactors.length
                });
            }
        }

        // Ordenar por nível de risco (high > medium > low)
        const riskOrder = { high: 3, medium: 2, low: 1 };
        studentsAtRisk.sort((a, b) => riskOrder[b.riskLevel] - riskOrder[a.riskLevel]);

        res.json({
            success: true,
            total: studentsAtRisk.length,
            data: studentsAtRisk,
            summary: {
                high: studentsAtRisk.filter(s => s.riskLevel === 'high').length,
                medium: studentsAtRisk.filter(s => s.riskLevel === 'medium').length,
                low: studentsAtRisk.filter(s => s.riskLevel === 'low').length
            }
        });

    } catch (error) {
        console.error('Erro ao buscar alunos em risco:', error);
        res.status(500).json({ error: 'Erro ao buscar alunos em risco' });
    }
});

/**
 * GET /api/reports/financial-summary
 * Retorna resumo financeiro consolidado
 */
router.get('/financial-summary', auth, async (req, res) => {
    try {
        const { unitId, startDate, endDate } = req.query;
        const userUnitId = req.user.unitId;

        const whereClause = { scope: 'business' };

        if (unitId && unitId !== 'all') {
            whereClause.unitId = unitId;
        } else if (userUnitId && ![1, 10].includes(req.user.roleId)) {
            whereClause.unitId = userUnitId;
        }

        if (startDate && endDate) {
            whereClause.dueDate = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        // Receitas
        const totalRevenue = await FinancialRecord.sum('amount', {
            where: { ...whereClause, direction: 'income' }
        }) || 0;

        const paidRevenue = await FinancialRecord.sum('amount', {
            where: { ...whereClause, direction: 'income', status: 'paid' }
        }) || 0;

        const pendingRevenue = await FinancialRecord.sum('amount', {
            where: { ...whereClause, direction: 'income', status: 'pending' }
        }) || 0;

        const overdueRevenue = await FinancialRecord.sum('amount', {
            where: {
                ...whereClause,
                direction: 'income',
                status: 'pending',
                dueDate: { [Op.lt]: new Date() }
            }
        }) || 0;

        // Despesas
        const totalExpenses = await FinancialRecord.sum('amount', {
            where: { ...whereClause, direction: 'expense' }
        }) || 0;

        const paidExpenses = await FinancialRecord.sum('amount', {
            where: { ...whereClause, direction: 'expense', status: 'paid' }
        }) || 0;

        const pendingExpenses = await FinancialRecord.sum('amount', {
            where: { ...whereClause, direction: 'expense', status: 'pending' }
        }) || 0;

        // Por categoria
        const revenueByCategory = await FinancialRecord.findAll({
            attributes: [
                'category',
                [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: { ...whereClause, direction: 'income' },
            group: ['category'],
            raw: true
        });

        const expensesByCategory = await FinancialRecord.findAll({
            attributes: [
                'category',
                [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            where: { ...whereClause, direction: 'expense' },
            group: ['category'],
            raw: true
        });

        res.json({
            success: true,
            data: {
                revenue: {
                    total: totalRevenue,
                    paid: paidRevenue,
                    pending: pendingRevenue,
                    overdue: overdueRevenue,
                    byCategory: revenueByCategory
                },
                expenses: {
                    total: totalExpenses,
                    paid: paidExpenses,
                    pending: pendingExpenses,
                    byCategory: expensesByCategory
                },
                balance: {
                    total: totalRevenue - totalExpenses,
                    realized: paidRevenue - paidExpenses,
                    projected: (totalRevenue - overdueRevenue) - totalExpenses
                }
            }
        });

    } catch (error) {
        console.error('Erro ao gerar resumo financeiro:', error);
        res.status(500).json({ error: 'Erro ao gerar resumo financeiro' });
    }
});

/**
 * GET /api/reports/class-performance
 * Retorna performance das turmas
 */
router.get('/class-performance', auth, async (req, res) => {
    try {
        const { unitId } = req.query;
        const userUnitId = req.user.unitId;

        const whereClause = {};
        if (unitId && unitId !== 'all') {
            whereClause.unitId = unitId;
        } else if (userUnitId && ![1, 10].includes(req.user.roleId)) {
            whereClause.unitId = userUnitId;
        }

        const classes = await Class.findAll({
            where: whereClause,
            include: [
                { model: Course }
            ]
        });

        const classPerformance = [];

        for (const cls of classes) {
            const totalStudents = await Student.count({
                where: { classId: cls.id }
            });

            const activeStudents = await Student.count({
                where: { classId: cls.id, status: 'active' }
            });

            const completedStudents = await Student.count({
                where: { classId: cls.id, status: 'inactive' }
            });

            // Taxa de ocupação
            const occupancyRate = cls.capacity ? (totalStudents / cls.capacity) * 100 : 0;

            // Receita gerada
            const revenue = await FinancialRecord.sum('amount', {
                where: {
                    classId: cls.id,
                    direction: 'income'
                }
            }) || 0;

            const paidRevenue = await FinancialRecord.sum('amount', {
                where: {
                    classId: cls.id,
                    direction: 'income',
                    status: 'paid'
                }
            }) || 0;

            classPerformance.push({
                id: cls.id,
                name: cls.name,
                course: cls.Course?.name,
                status: cls.status,
                capacity: cls.capacity,
                totalStudents,
                activeStudents,
                completedStudents,
                occupancyRate: occupancyRate.toFixed(1),
                revenue,
                paidRevenue,
                startDate: cls.startDate,
                endDate: cls.endDate
            });
        }

        res.json({
            success: true,
            total: classPerformance.length,
            data: classPerformance
        });

    } catch (error) {
        console.error('Erro ao gerar relatório de turmas:', error);
        res.status(500).json({ error: 'Erro ao gerar relatório de turmas' });
    }
});

module.exports = router;
