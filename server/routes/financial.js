const express = require('express');
const router = express.Router();
const FinancialRecord = require('../models/FinancialRecord');
const Student = require('../models/Student');
const CashRegister = require('../models/CashRegister');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { checkUnitIsolation } = require('../utils/unitIsolation');
const { ROLE_IDS } = require('../config/roles');
const { Op } = require('sequelize');
const crypto = require('crypto');
const Holidays = require('date-holidays');
const hd = new Holidays('BR');

const getNextBusinessDay = (dateObj) => {
    let d = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 12, 0, 0);

    const isHolidayOrWeekend = (date) => {
        const day = date.getDay();
        if (day === 0 || day === 6) return true; // Sunday or Saturday
        const h = hd.isHoliday(date);
        return h && h.some(hol => hol.type === 'public');
    };

    while (isHolidayOrWeekend(d)) {
        d.setDate(d.getDate() + 1);
    }

    const resY = d.getFullYear();
    const resM = String(d.getMonth() + 1).padStart(2, '0');
    const resD = String(d.getDate()).padStart(2, '0');
    return `${resY}-${resM}-${resD}`;
};

// Apply auth to all routes in this file
router.use(auth);

// --- Records Routes ---

// PUT /financial/:id - Update record
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { description, amount, dueDate, category, status, type, direction, scope, paymentMethod, paymentDate, updateScope, launchType, periodicity } = req.body;

        const record = await FinancialRecord.findByPk(id);
        if (!record) return res.status(404).json({ error: 'Registro não encontrado' });

        if (!checkUnitIsolation(res, req.user, record.unitId)) return;

        const updateData = {
            description,
            amount,
            dueDate,
            category,
            status
        };

        if (type) updateData.type = type;
        if (direction) updateData.direction = direction;
        if (scope) updateData.scope = scope;
        if (paymentMethod) updateData.paymentMethod = paymentMethod;
        if (paymentDate) updateData.paymentDate = paymentDate;
        if (launchType) updateData.launchType = launchType;
        if (periodicity) updateData.periodicity = periodicity;

        console.log('🔍 PUT /financial/:id DEBUG:', {
            id,
            updateScope,
            planId: record.planId,
            amount: updateData.amount,
            dueDate: record.dueDate
        });

        if (updateScope === 'all' && record.planId) {
            // Atualizar apenas este registro e os futuros (não os passados/pagos)
            const result = await FinancialRecord.update({
                amount: updateData.amount,
                category: updateData.category,
                description: updateData.description,
                type: updateData.type || record.type,
                direction: updateData.direction || record.direction,
                scope: updateData.scope || record.scope,
                launchType: updateData.launchType || record.launchType,
                periodicity: updateData.periodicity || record.periodicity
            }, {
                where: {
                    planId: record.planId,
                    dueDate: {
                        [Op.gte]: record.dueDate  // Apenas este e futuros
                    }
                }
            });

            console.log('✅ Registros atualizados:', result[0]);
            await record.reload(); // Recarregar para pegar valores atualizados
        } else {
            await record.update(updateData);
        }

        res.json(record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Cash Register Routes ---

// GET /financial/cash-register/status - Get current open register
router.get('/cash-register/status', async (req, res) => {
    try {
        const { unitId, roleId } = req.user;
        const isGlobal = [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(Number(roleId));

        const where = { status: 'open' };
        if (!isGlobal) where.unitId = unitId;

        // Find if there is an open register
        const openRegister = await CashRegister.findOne({
            where,
            include: [{ model: User, as: 'operator', attributes: ['name'] }],
            order: [['openedAt', 'DESC']]
        });

        if (openRegister) {
            return res.json({ status: 'open', register: openRegister });
        }

        // If no open register, find the last closed one
        const lastWhere = {};
        if (!isGlobal) lastWhere.unitId = unitId;

        const lastRegister = await CashRegister.findOne({
            where: lastWhere,
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
        const existingOpen = await CashRegister.findOne({
            where: { status: 'open', unitId: req.user.unitId }
        });
        if (existingOpen) {
            return res.status(400).json({ error: 'Já existe um caixa aberto para esta unidade.' });
        }

        const newRegister = await CashRegister.create({
            userId,
            unitId: req.user.unitId,
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

        const openRegister = await CashRegister.findOne({
            where: { status: 'open', unitId: req.user.unitId }
        });
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
        const openRegister = await CashRegister.findOne({
            where: { status: 'open', unitId: req.user.unitId }
        });

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
            cashRegisterId,
            userId: req.user.id,
            unitId: req.user.unitId
        });

        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /financial/record - Create generic record (Bill/Revenue)
router.post('/record', async (req, res) => {
    try {
        const { type, category, description, amount, direction, dueDate, status, paymentMethod, paymentDate, scope, installments, launchType, periodicity } = req.body;

        const openRegister = await CashRegister.findOne({
            where: { status: 'open', unitId: req.user.unitId }
        });

        const numInstallments = parseInt(installments) || 1;
        const totalAmount = parseFloat(amount);

        console.log('🔍 DEBUG /record:', {
            installments,
            numInstallments,
            amount,
            totalAmount,
            launchType,
            periodicity,
            dueDate
        });

        // Date Handling: Use noon to avoid TZ shift
        const dateParts = dueDate.split('-').map(Number);
        const baseDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], 12, 0, 0);

        if (numInstallments > 1) {
            const planId = crypto.randomUUID();

            // Para recorrente: usar o valor direto (já é o valor da parcela)
            // Para parcelado: dividir o total pelo número de parcelas
            const installmentAmount = (launchType === 'recorrente')
                ? totalAmount.toFixed(2)
                : (totalAmount / numInstallments).toFixed(2);

            const records = [];

            for (let i = 1; i <= numInstallments; i++) {
                let currentIterationDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 12, 0, 0);

                // Add interval based on periodicity
                if (i > 1) {
                    const p = (periodicity || 'mensal').toLowerCase();
                    if (p === 'diaria') currentIterationDate.setDate(baseDate.getDate() + (i - 1));
                    else if (p === 'semanal') currentIterationDate.setDate(baseDate.getDate() + (i - 1) * 7);
                    else if (p === 'quinzenal') currentIterationDate.setDate(baseDate.getDate() + (i - 1) * 15);
                    else if (p === 'mensal') currentIterationDate.setMonth(baseDate.getMonth() + (i - 1));
                    else if (p === 'bimestral') currentIterationDate.setMonth(baseDate.getMonth() + (i - 1) * 2);
                    else if (p === 'trimestral') currentIterationDate.setMonth(baseDate.getMonth() + (i - 1) * 3);
                    else if (p === 'semestral') currentIterationDate.setMonth(baseDate.getMonth() + (i - 1) * 6);
                    else if (p === 'anual') currentIterationDate.setFullYear(baseDate.getFullYear() + (i - 1));
                    else currentIterationDate.setMonth(baseDate.getMonth() + (i - 1)); // Default monthly
                }

                // Adjust for next business day
                const currentDueDateStr = getNextBusinessDay(currentIterationDate);

                // Only the first installment can be 'paid' if status was 'paid'
                const currentStatus = (i === 1 && status === 'paid') ? 'paid' : (i > 1 && status === 'paid' ? 'pending' : status);

                let cashRegisterId = null;
                if (currentStatus === 'paid' && openRegister) {
                    cashRegisterId = openRegister.id;
                    const val = parseFloat(installmentAmount);
                    const current = parseFloat(openRegister.currentBalance);
                    const newBal = direction === 'income' ? current + val : current - val;
                    await openRegister.update({ currentBalance: newBal });
                }

                // Only show numbering for "parcelado"
                const finalDescription = launchType === 'parcelado'
                    ? `${description} (${i}/${numInstallments})`
                    : description;

                records.push({
                    type: type || 'outros',
                    category,
                    description: finalDescription,
                    amount: installmentAmount,
                    direction,
                    dueDate: currentDueDateStr,
                    scope: scope || 'business',
                    status: currentStatus,
                    paymentDate: currentStatus === 'paid' ? (paymentDate || new Date()) : null,
                    paymentMethod: currentStatus === 'paid' ? paymentMethod : null,
                    cashRegisterId,
                    userId: req.user.id,
                    unitId: req.user.unitId,
                    installments: numInstallments,
                    currentInstallment: i,
                    planId,
                    launchType: launchType || 'parcelado',
                    periodicity: periodicity || 'mensal'
                });
            }

            const createdRecords = await FinancialRecord.bulkCreate(records);
            return res.status(201).json(createdRecords[0]);
        } else {
            // Single Record: Still adjust for next business day
            const finalDueDate = getNextBusinessDay(baseDate);

            let cashRegisterId = null;
            if (status === 'paid' && openRegister) {
                cashRegisterId = openRegister.id;
                const val = parseFloat(totalAmount);
                const current = parseFloat(openRegister.currentBalance);
                const newBal = direction === 'income' ? current + val : current - val;
                await openRegister.update({ currentBalance: newBal });
            }

            const record = await FinancialRecord.create({
                type: type || 'outros',
                category,
                description,
                amount: totalAmount,
                direction,
                dueDate: finalDueDate,
                scope: scope || 'business',
                status: status || 'pending',
                paymentDate: status === 'paid' ? (paymentDate || new Date()) : null,
                paymentMethod: status === 'paid' ? paymentMethod : null,
                cashRegisterId,
                userId: req.user.id,
                unitId: req.user.unitId,
                installments: 1,
                currentInstallment: 1,
                launchType: launchType || 'unico',
                periodicity: periodicity || 'mensal'
            });

            return res.status(201).json(record);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /financial/dre - DRE Report
router.get('/dre', async (req, res) => {
    try {
        const { unitId, roleId } = req.user;
        const isGlobal = [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(Number(roleId));

        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
        const end = endDate ? new Date(endDate) : new Date();

        const where = {
            status: 'paid',
            paymentDate: {
                [Op.between]: [start, end]
            }
        };

        if (!isGlobal) {
            where.unitId = unitId;
        }

        const records = await FinancialRecord.findAll({
            where,
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
        const { unitId, roleId } = req.user;
        const { scope, startDate, endDate } = req.query; // Filter by scope and date range

        const where = {};
        if (scope) {
            where.scope = scope;
        }

        // Filtro de data
        if (startDate && endDate) {
            where.dueDate = {
                [Op.between]: [startDate, endDate]
            };
        } else if (startDate) {
            where.dueDate = {
                [Op.gte]: startDate
            };
        } else if (endDate) {
            where.dueDate = {
                [Op.lte]: endDate
            };
        }

        const isGlobal = [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(Number(roleId));
        if (!isGlobal) {
            where.unitId = unitId;
        }

        const records = await FinancialRecord.findAll({
            where,
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

        if (!checkUnitIsolation(res, req.user, record.unitId)) return;

        // Check for open register if paying
        const openRegister = await CashRegister.findOne({
            where: { status: 'open', unitId: req.user.unitId }
        });

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
            cashRegisterId,
            discount: req.body.discount || 0,
            interest: req.body.interest || 0,
            fine: req.body.fine || 0,
            amount: req.body.amount || record.amount // Update amount to the final paid value if provided
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
        const { id: userId, unitId } = req.user;
        const { enrollmentFee, courseFee, materialFee } = fees;

        console.log('🚀 POST /financial/batch received:', {
            studentId,
            enrollmentId,
            fees_keys: Object.keys(fees || {})
        });

        // Check open register for any paid-up-front fees
        const openRegister = await CashRegister.findOne({
            where: { status: 'open', unitId: req.user.unitId }
        });

        const records = [];
        let totalIncomeToAdd = 0;

        // Helper to check if paid and process
        const processFee = (fee, type, category) => {
            // Validate Check
            if (!fee || !fee.amount) return;
            const amountVal = parseFloat(fee.amount);
            if (isNaN(amountVal) || amountVal <= 0) return;

            if (fee.source === 'publisher') return; // Skip publisher material

            const totalAmount = amountVal;
            const numInstallments = parseInt(fee.installments) || 1;
            const installmentValue = (totalAmount / numInstallments).toFixed(2);

            // Validate Date
            let baseDate;
            if (!fee.dueDate) {
                baseDate = new Date();
            } else {
                baseDate = new Date(fee.dueDate);
                // Fallback for invalid date
                if (isNaN(baseDate.getTime())) baseDate = new Date();
            }

            for (let i = 0; i < numInstallments; i++) {
                const dueDate = new Date(baseDate);
                dueDate.setMonth(dueDate.getMonth() + i);

                // If it's the first installment and 'isPaid' is checked
                const isFirstPaid = (i === 0 && fee.isPaid);

                if (isFirstPaid && openRegister) {
                    // Only add to current cash if paid now
                    totalIncomeToAdd += parseFloat(installmentValue);
                }

                records.push({
                    enrollmentId,
                    studentId,
                    type,
                    category,
                    amount: installmentValue,
                    dueDate: dueDate,
                    paymentDate: isFirstPaid ? new Date() : null,
                    status: isFirstPaid ? 'paid' : 'pending',
                    direction: 'income',
                    paymentMethod: fee.method,
                    installments: numInstallments,
                    installmentNumber: i + 1,
                    unitId,
                    userId,
                    description: `${category} (${i + 1}/${numInstallments})`,
                    launchType: numInstallments > 1 ? 'parcelado' : 'unico',
                    periodicity: 'mensal'
                });
            }
        };

        processFee(enrollmentFee, 'matricula', 'Matrícula');
        processFee(courseFee, 'curso', 'Curso');
        processFee(materialFee, 'material', 'Material Didático');

        console.log(`📝 Prepared ${records.length} records for bulkCreate`);

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
        console.error('❌ Error in /financial/batch:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- Data Tools Middleware ---
const checkDataToolsAccess = (req, res, next) => {
    // Only Financial Leadership/Admin/Manager/Master
    const allowed = ['master', 'franchisee', 'manager', 'admin', 'admin_financial_manager'];
    if (!allowed.includes(req.user.role)) {
        return res.status(403).json({ error: 'Acesso negado.' });
    }
    next();
};

// GET /financial/export/csv
router.get('/export/csv', auth, checkDataToolsAccess, async (req, res) => {
    try {
        const { unitId, roleId } = req.user;
        const isGlobal = [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(Number(roleId));
        const where = {};
        if (!isGlobal) where.unitId = unitId;

        const records = await FinancialRecord.findAll({ where, raw: true });

        const fields = ['description', 'category', 'amount', 'type', 'direction', 'status', 'dueDate', 'paymentDate'];
        let csv = fields.join(',') + '\n';

        records.forEach(r => {
            const row = fields.map(field => {
                let val = r[field] || '';
                if (field.includes('Date') && val) val = new Date(val).toLocaleDateString('pt-BR');
                val = String(val).replace(/"/g, '""');
                if (val.includes(',') || val.includes('"')) val = `"${val}"`;
                return val;
            });
            csv += row.join(',') + '\n';
        });

        res.header('Content-Type', 'text/csv');
        res.attachment(`financial_export_${new Date().getTime()}.csv`);
        res.send(csv);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /financial/import/csv
router.post('/import/csv', auth, checkDataToolsAccess, async (req, res) => {
    try {
        const { csvContent } = req.body;
        if (!csvContent) return res.status(400).json({ error: 'CSV Inválido' });

        const lines = csvContent.split(/\r?\n/);
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

        let success = 0;
        let failed = 0;

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = lines[i].split(',');
            if (values.length < 3) { failed++; continue; }

            const data = {};
            headers.forEach((h, index) => {
                let val = values[index] ? values[index].trim() : '';
                if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
                if (['description', 'category', 'amount', 'type', 'direction', 'status', 'dueDate'].includes(h)) {
                    data[h] = val;
                }
            });

            if (!data.amount || !data.description) { failed++; continue; }

            // Create Record
            await FinancialRecord.create({
                ...data,
                unitId: req.user.unitId,
                dueDate: data.dueDate || new Date(),
                paymentDate: data.status === 'paid' ? new Date() : null,
                // cashRegisterId: null // Import doesn't link to cash register
            });
            success++;
        }
        res.json({ message: 'Importado', success, failed });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /financial/advance - Antecipação de Recebíveis
router.post('/advance', auth, async (req, res) => {
    try {
        const { recordIds, totalFee } = req.body;
        const { unitId, roleId, id: userId } = req.user;
        const isGlobal = [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(Number(roleId));
        const where = { id: recordIds };
        if (!isGlobal) where.unitId = unitId;

        const records = await FinancialRecord.findAll({ where });
        if (!records.length) return res.status(404).json({ error: 'Nenhum registro encontrado' });

        const openRegister = await CashRegister.findOne({
            where: { status: 'open', unitId: req.user.unitId }
        });
        if (!openRegister) return res.status(400).json({ error: 'É necessário ter um caixa aberto para realizar a antecipação.' });

        let totalGross = 0;
        for (const record of records) {
            totalGross += parseFloat(record.amount);
            // Mark record as paid (advanced)
            await record.update({
                status: 'paid',
                paymentDate: new Date(),
                description: record.description + ' (Antecipado)'
            });
        }

        const netAmount = totalGross - parseFloat(totalFee || 0);

        // Add to cash register
        await openRegister.update({
            currentBalance: parseFloat(openRegister.currentBalance) + netAmount
        });

        // Add a fee record (expense)
        await FinancialRecord.create({
            type: 'outros',
            category: 'Taxa Bancária',
            amount: totalFee,
            dueDate: new Date(),
            paymentDate: new Date(),
            status: 'paid',
            direction: 'expense',
            unitId,
            userId,
            description: `Taxa de antecipação de ${records.length} títulos`
        });

        res.json({ success: true, netAmount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /financial/:id - Delete record
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { deleteScope } = req.query; // 'current' or 'all'

        console.log('🔍 DELETE /financial/:id - Recebido:', { id, deleteScope });

        const record = await FinancialRecord.findByPk(id);
        if (!record) return res.status(404).json({ error: 'Registro não encontrado' });

        console.log('📋 Registro encontrado:', {
            id: record.id,
            description: record.description,
            planId: record.planId,
            dueDate: record.dueDate,
            launchType: record.launchType,
            installments: record.installments
        });

        if (!checkUnitIsolation(res, req.user, record.unitId)) return;

        let deletedCount = 1;

        // Se deleteScope=all e o registro tem planId, excluir este e todos os futuros
        if (deleteScope === 'all' && record.planId) {
            console.log('🗑️ Excluindo TODOS os futuros com planId:', record.planId);

            // Primeiro, vamos ver quantos registros existem
            const allRecordsInPlan = await FinancialRecord.findAll({
                where: {
                    planId: record.planId
                },
                attributes: ['id', 'dueDate', 'description'],
                order: [['dueDate', 'ASC']]
            });

            console.log('📊 Total de registros no plano:', allRecordsInPlan.length);
            console.log('📅 Registros no plano:', allRecordsInPlan.map(r => ({ id: r.id, dueDate: r.dueDate })));

            // Excluir este registro e todos com mesmo planId e dueDate >= atual
            const result = await FinancialRecord.destroy({
                where: {
                    planId: record.planId,
                    dueDate: {
                        [Op.gte]: record.dueDate
                    }
                }
            });
            deletedCount = result;
            console.log('✅ Registros excluídos:', deletedCount);
        } else {
            console.log('🗑️ Excluindo apenas este registro');
            // Excluir apenas este registro
            await record.destroy();
        }

        res.json({ message: 'Registro(s) excluído(s) com sucesso', count: deletedCount });
    } catch (error) {
        console.error('❌ Erro ao excluir:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
