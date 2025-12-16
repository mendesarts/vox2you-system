const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Class = require('../models/Class');
const Course = require('../models/Course');
const FinancialRecord = require('../models/FinancialRecord');
const Lead = require('../models/Lead');
const User = require('../models/User');
const Unit = require('../models/Unit');
const { Op, Sequelize } = require('sequelize');

// GET /dashboard/main-stats
router.get('/main-stats', async (req, res) => {
    try {
        const { unitId } = req.query;
        // Build scope for queries
        const scope = unitId ? { unitId } : {};

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Fetch Units for Selector
        const units = await Unit.findAll({ attributes: ['id', 'name'] });

        // --- 1. COMERCIAL (Leads) ---
        const totalLeads = await Lead.count({ where: { ...scope } });
        const newLeadsMonth = await Lead.count({
            where: { ...scope, createdAt: { [Op.gte]: startOfMonth } }
        });
        const salesMonth = await Lead.count({
            where: {
                ...scope,
                status: 'won',
                updatedAt: { [Op.gte]: startOfMonth }
            }
        });

        // Conversion Rate
        const conversionRate = newLeadsMonth > 0 ? ((salesMonth / newLeadsMonth) * 100).toFixed(1) : (0).toFixed(1);

        // --- TEAM PERFORMANCE ---
        // If unit selected, filter consultants by that unit. If master, show all.
        // Adjust role to 'sales' (Consultor Comercial)
        const consultantScope = { role: 'sales' };
        if (unitId) consultantScope.unitId = unitId;

        const consultants = await User.findAll({ where: consultantScope });
        const teamPerformance = await Promise.all(consultants.map(async (user) => {
            const sales = await Lead.count({
                where: {
                    consultantId: user.id,
                    status: 'won',
                    updatedAt: { [Op.gte]: startOfMonth }
                }
            });
            // Simple mock goal
            const goal = 10;
            return {
                id: user.id,
                name: user.name,
                avatar: user.avatar, // if exists
                role: user.role,
                sales,
                goal,
                progress: Math.min((sales / goal) * 100, 100).toFixed(0)
            };
        }));


        // --- 2. FINANCEIRO (Cashflow) ---
        const revenue = await FinancialRecord.sum('amount', {
            where: {
                ...scope,
                direction: 'income',
                status: 'paid',
                paymentDate: { [Op.between]: [startOfMonth, endOfMonth] }
            }
        }) || 0;

        const expense = await FinancialRecord.sum('amount', {
            where: {
                ...scope,
                direction: 'expense',
                status: 'paid',
                paymentDate: { [Op.between]: [startOfMonth, endOfMonth] }
            }
        }) || 0;

        // --- 3. PEDAGÓGICO (Alunos) ---
        const activeStudents = await Student.count({ where: { ...scope, status: 'active' } });
        const activeClasses = await Class.count({ where: { ...scope, status: 'active' } });

        res.json({
            units, // List of available units
            selectedUnit: unitId || 'all',
            commercial: {
                totalLeads,
                newLeadsMonth,
                salesMonth,
                conversionRate,
                teamPerformance
            },
            financial: {
                revenue,
                expense,
                balance: (revenue - expense)
            },
            pedagogical: {
                activeStudents,
                activeClasses
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// GET /dashboard/financial-stats (Kept for compatibility if other pages use it, otherwise can be removed later)
router.get('/financial-stats', async (req, res) => {
    try {
        const activeRec = await FinancialRecord.findAll({ limit: 5, order: [['createdAt', 'DESC']] });
        res.json({ recent: activeRec });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
