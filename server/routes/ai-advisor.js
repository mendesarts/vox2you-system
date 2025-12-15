const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Student = require('../models/Student');
const FinancialRecord = require('../models/FinancialRecord');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');

// GET /api/ai-advisor/analyze
router.get('/analyze', async (req, res) => {
    try {
        // 1. Gather Data
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Financials (Current Month)
        const financialRecords = await FinancialRecord.findAll({
            where: {
                paymentDate: { [Op.gte]: firstDayOfMonth },
                status: 'paid'
            }
        });

        let revenue = 0;
        let expenses = 0;
        const expensesByCategory = {};

        financialRecords.forEach(r => {
            const val = parseFloat(r.amount);
            if (r.direction === 'income') {
                revenue += val;
            } else {
                expenses += val;
                expensesByCategory[r.category] = (expensesByCategory[r.category] || 0) + val;
            }
        });

        const profit = revenue - expenses;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        // Pedagogical
        const totalStudents = await Student.count({ where: { status: 'active' } });
        const newStudents = await Student.count({
            where: {
                status: 'active',
                createdAt: { [Op.gte]: firstDayOfMonth }
            }
        });

        // Attendance (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const attendances = await Attendance.findAll({
            where: { date: { [Op.gte]: thirtyDaysAgo } }
        });

        let attendanceRate = 0;
        if (attendances.length > 0) {
            const present = attendances.filter(a => a.present).length;
            attendanceRate = (present / attendances.length) * 100;
        }

        // 2. "AI" Analysis Logic (Heuristics)
        const insights = [];

        // Financial Insights
        if (profit > 0) {
            insights.push({
                type: 'success',
                area: 'Financeiro',
                title: 'Saúde Financeira Positiva',
                message: `Sua margem de lucro este mês está em ${margin.toFixed(1)}%. Continue mantendo as despesas controladas.`
            });
        } else {
            insights.push({
                type: 'danger',
                area: 'Financeiro',
                title: 'Alerta de Prejuízo',
                message: `Você está operando com saldo negativo de R$ ${Math.abs(profit).toFixed(2)} este mês. Revise gastos imediatos.`
            });
        }

        const topExpense = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])[0];
        if (topExpense) {
            insights.push({
                type: 'info',
                area: 'Gestão de Custos',
                title: 'Maior Centro de Custo',
                message: `Sua maior despesa é "${topExpense[0]}" (R$ ${topExpense[1].toFixed(2)}). Verifique se há oportunidades de redução nesta categoria.`
            });
        }

        // Operational/Pedagogical Insights
        if (attendanceRate < 75) {
            insights.push({
                type: 'warning',
                area: 'Operacional / Pedagógico',
                title: 'Risco de Evasão (Churn)',
                message: `A frequência média está baixa (${attendanceRate.toFixed(1)}%). Alunos faltosos tendem a cancelar. Ação sugerida: Disparar mensagens de "Sentimos sua falta" para alunos com >2 faltas.`
            });
        } else {
            insights.push({
                type: 'success',
                area: 'Pedagógico',
                title: 'Alto Engajamento',
                message: `A frequência dos alunos está excelente (${attendanceRate.toFixed(1)}%). Isso indica alta satisfação e retenção.`
            });
        }

        if (newStudents === 0) {
            insights.push({
                type: 'warning',
                area: 'Estratégico / Vendas',
                title: 'Estagnação de Crescimento',
                message: 'Nenhuma nova matrícula realizada este mês. Considere reativar campanhas de Marketing ou contatar leads antigos.'
            });
        } else {
            insights.push({
                type: 'success',
                area: 'Crescimento',
                title: 'Novas Matrículas',
                message: `Parabéns! Você conquistou ${newStudents} novos alunos este mês. O crescimento está ativo.`
            });
        }

        // Strategic General Tip
        const strategies = [
            "Dica de Ouro: Tente oferecer um desconto de pontualidade para reduzir a inadimplência.",
            "Dica de Ouro: Crie eventos sociais bimestrais para aumentar o senso de comunidade da escola.",
            "Dica de Ouro: Peça indicações (MGM) para seus alunos mais satisfeitos em troca de brindes.",
            "Dica de Ouro: Revise seus contratos anualmente para ajustar valores pela inflação."
        ];
        const randomStrategy = strategies[Math.floor(Math.random() * strategies.length)];

        insights.push({
            type: 'primary',
            area: 'Estratégia IA',
            title: 'Sugestão Estratégica',
            message: randomStrategy
        });

        res.json({
            date: now.toISOString(),
            stats: {
                revenue,
                expenses,
                margin,
                attendanceRate,
                newStudents
            },
            insights
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao gerar análise de IA' });
    }
});

module.exports = router;
