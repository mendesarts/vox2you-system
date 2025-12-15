const express = require('express');
const router = express.Router();
const FinancialRecord = require('../models/FinancialRecord');
const Student = require('../models/Student');
const CashRegister = require('../models/CashRegister');
const User = require('../models/User');

// --- Cash Register Routes ---

// GET /financial/cash-register/status - Get current open register
router.get('/cash-register/status', async (req, res) => {
    try {
        // Find if there is an open register
        const openRegister = await CashRegister.findOne({
            where: { status: 'open' },
            include: [{ model: User, as: 'operator', attributes: ['name'] }],
            order: [['openedAt', 'DESC']]
        });

        if (openRegister) {
            return res.json({ status: 'open', register: openRegister });
        }

        // If no open register, find the last closed one
        const lastRegister = await CashRegister.findOne({
            order: [['closedAt', 'DESC']],
            include: [{ model: User, as: 'operator', attributes: ['name'] }]
        });

        res.json({ status: 'closed', register: lastRegister });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /financial/cash-register/open - Open a new register
router.post('/cash-register/open', async (req, res) => {
    try {
        const { userId, openingBalance, notes } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'Usuário não identificado. Relogue no sistema.' });
        }

        // Check if already open
        const existingOpen = await CashRegister.findOne({ where: { status: 'open' } });
        if (existingOpen) {
            return res.status(400).json({ error: 'Já existe um caixa aberto.' });
        }

        const newRegister = await CashRegister.create({
            userId,
            openingBalance: openingBalance || 0,
            currentBalance: openingBalance || 0,
            notes,
            status: 'open',
            openedAt: new Date()
        });

        res.status(201).json(newRegister);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /financial/cash-register/close - Close currrent register
router.post('/cash-register/close', async (req, res) => {
    try {
        const { closingBalance, notes } = req.body;

        const openRegister = await CashRegister.findOne({ where: { status: 'open' } });
        if (!openRegister) {
            return res.status(400).json({ error: 'Não há caixa aberto para fechar.' });
        }

        // Validate closing balance roughly matches currentBalance? 
        // Creating a "closing difference" record? For now, just update.
        await openRegister.update({
            status: 'closed',
            closingBalance,
            closedAt: new Date(),
            notes: notes ? (openRegister.notes + '\n' + notes) : openRegister.notes
        });

        res.json(openRegister);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /financial/transaction - Create ad-hoc transaction (Sangria/Suprimento/Despesa)
router.post('/transaction', async (req, res) => {
    try {
        const { category, type, description, amount, direction, paymentMethod, paymentDate } = req.body;

        // Find open register
        const openRegister = await CashRegister.findOne({ where: { status: 'open' } });

        // If cash transaction, require open register? Or allow "pending" expense?
        // If it's paid now, update register.

        let cashRegisterId = null;
        if (openRegister) {
            cashRegisterId = openRegister.id;

            // Update register balance
            const val = parseFloat(amount);
            const current = parseFloat(openRegister.currentBalance);
            const newBal = direction === 'income' ? current + val : current - val;

            await openRegister.update({ currentBalance: newBal });
        } else {
            // If no register open, warn? Or allow as general record?
            // User requested "robust... manage cash". Usually requires open box for cash ops.
            // If method is bank transfer, maybe doesn't need cash register. 
            // Logic: If Payment is linked to cash register, update it.
        }

        const record = await FinancialRecord.create({
            category,
            type: type || 'outros', // e.g. 'sangria', 'suprimento', 'despesa'
            description,
            amount,
            direction,
            paymentMethod,
            paymentDate: paymentDate || new Date(),
            dueDate: paymentDate || new Date(),
            status: 'paid', // Instant transaction
            cashRegisterId
        });

        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /financial/record - Create generic record (Bill/Revenue)
router.post('/record', async (req, res) => {
    try {
        const { type, category, description, amount, direction, dueDate, status, paymentMethod, paymentDate } = req.body;

        const openRegister = await CashRegister.findOne({ where: { status: 'open' } });
        let cashRegisterId = null;

        if (status === 'paid' && openRegister) {
            cashRegisterId = openRegister.id;
            const val = parseFloat(amount);
            const current = parseFloat(openRegister.currentBalance);
            const newBal = direction === 'income' ? current + val : current - val;
            await openRegister.update({ currentBalance: newBal });
        }

        const record = await FinancialRecord.create({
            type: type || 'outros',
            category,
            description,
            amount,
            direction,
            dueDate,
            status: status || 'pending',
            paymentDate: status === 'paid' ? (paymentDate || new Date()) : null,
            paymentMethod: status === 'paid' ? paymentMethod : null,
            cashRegisterId
        });

        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /financial/dre - DRE Report
router.get('/dre', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const { Op } = require('sequelize');

        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1)); // Default first day of month
        const end = endDate ? new Date(endDate) : new Date(); // Default today

        const records = await FinancialRecord.findAll({
            where: {
                status: 'paid',
                paymentDate: {
                    [Op.between]: [start, end]
                }
            },
            attributes: ['direction', 'category', 'amount']
        });

        const report = {
            revenue: {},
            expenses: {},
            totalRevenue: 0,
            totalExpenses: 0,
            netResult: 0
        };

        records.forEach(r => {
            const val = parseFloat(r.amount);
            if (r.direction === 'income') {
                report.revenue[r.category] = (report.revenue[r.category] || 0) + val;
                report.totalRevenue += val;
            } else {
                report.expenses[r.category] = (report.expenses[r.category] || 0) + val;
                report.totalExpenses += val;
            }
        });

        report.netResult = report.totalRevenue - report.totalExpenses;

        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Existing Routes Updated ---

// GET /financial - List all records
router.get('/', async (req, res) => {
    try {
        const records = await FinancialRecord.findAll({
            include: [
                { model: Student, attributes: ['id', 'name'] },
                // Include Enrollment->Class->Course if needed, but remove if Enrollment invalid
                {
                    model: require('../models/Enrollment'),
                    required: false,
                    include: [
                        {
                            model: require('../models/Class'),
                            required: false,
                            include: [{ model: require('../models/Course'), required: false }]
                        }
                    ]
                }
            ],
            order: [['dueDate', 'ASC']]
        });
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /financial/:id/settle - Quitar pagamento
router.post('/:id/settle', async (req, res) => {
    try {
        const { paymentMethod, paymentDate } = req.body;
        const record = await FinancialRecord.findByPk(req.params.id);
        if (!record) return res.status(404).json({ error: 'Registro não encontrado' });

        // Check for open register if paying
        const openRegister = await CashRegister.findOne({ where: { status: 'open' } });

        let cashRegisterId = record.cashRegisterId;

        // Update register balance if register is open
        if (openRegister) {
            cashRegisterId = openRegister.id;
            const val = parseFloat(record.amount);
            const current = parseFloat(openRegister.currentBalance);
            // If paying a pending Income (Receivable) -> Balance increases
            // If paying a pending Expense (Payable) -> Balance decreases

            // Assumption: Settle usually implies "receiving money" for student fees (direction='income')
            // Or "paying bill" for expenses (direction='expense')

            let newBal = current;
            // Existing records default to direction='income' (matricula/curso).
            const direction = record.direction || 'income';

            if (direction === 'income') newBal += val;
            else newBal -= val;

            await openRegister.update({ currentBalance: newBal });
        }

        await record.update({
            status: 'paid',
            paymentDate: paymentDate || new Date(),
            paymentMethod: paymentMethod || record.paymentMethod,
            cashRegisterId
        });
        res.json({ message: 'Pagamento quitado', record });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /financial/batch - Create multiple records (enrollment, material, course)
router.post('/batch', async (req, res) => {
    try {
        const { enrollmentId, studentId, fees } = req.body;
        const { enrollmentFee, courseFee, materialFee } = fees;

        // Check open register for any paid-up-front fees
        const openRegister = await CashRegister.findOne({ where: { status: 'open' } });

        const records = [];
        let totalIncomeToAdd = 0;

        // Helper to check if paid and process
        const processFee = (fee, type, category) => {
            if (fee && fee.amount > 0) {
                const isPaid = fee.isPaid;
                if (isPaid && openRegister) {
                    totalIncomeToAdd += parseFloat(fee.amount);
                }

                // For course installments
                if (type === 'curso') {
                    const total = parseFloat(fee.amount);
                    const inst = parseInt(fee.installments) || 1;
                    const instalmentValue = total / inst;
                    const baseDate = new Date(fee.dueDate || new Date());

                    for (let i = 0; i < inst; i++) {
                        const dueDate = new Date(baseDate);
                        dueDate.setMonth(dueDate.getMonth() + i);
                        const thisPaid = isPaid && i === 0; // Only first is paid if isPaid checked? Or all? Usually just first/entrance. Assuming 'isPaid' means first installment/downpayment.
                        // Actually, 'courseFee.isPaid' usually means the first payment. 
                        // Let's assume isPaid applies to the *first* installment only for now, unless fully paid. 
                        // But for simplicity, if 'isPaid' is true, let's assume just the first one.

                        if (thisPaid && openRegister) totalIncomeToAdd += instalmentValue;

                        records.push({
                            enrollmentId, studentId, type, category,
                            amount: instalmentValue.toFixed(2),
                            dueDate: dueDate,
                            direction: 'income',
                            paymentMethod: fee.method,
                            installments: inst,
                            currentInstallment: i + 1,
                            status: thisPaid ? 'paid' : 'pending',
                            paymentDate: thisPaid ? new Date() : null,
                            cashRegisterId: thisPaid && openRegister ? openRegister.id : null
                        });
                    }
                } else {
                    // Single fee (Matricula, Material)
                    records.push({
                        enrollmentId, studentId, type, category,
                        amount: fee.amount,
                        dueDate: fee.dueDate || new Date(),
                        direction: 'income',
                        paymentMethod: fee.method,
                        installments: 1,
                        currentInstallment: 1,
                        status: isPaid ? 'paid' : 'pending',
                        paymentDate: isPaid ? new Date() : null,
                        cashRegisterId: isPaid && openRegister ? openRegister.id : null
                    });
                }
            }
        };

        processFee(enrollmentFee, 'matricula', 'Matrícula');
        processFee(materialFee, 'material', 'Material Didático');
        processFee(courseFee, 'curso', 'Mensalidade');

        if (records.length > 0) {
            await FinancialRecord.bulkCreate(records);
        }

        if (totalIncomeToAdd > 0 && openRegister) {
            await openRegister.update({
                currentBalance: parseFloat(openRegister.currentBalance) + totalIncomeToAdd
            });
        }

        res.status(201).json({ message: 'Financeiro gerado', count: records.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
