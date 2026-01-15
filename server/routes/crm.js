// ⚠️ ATTENTION: Read ARCHITECTURE_GUIDELINES.md in the root directory before modifying logic related to roles, units, or permissions. Always use numeric roleId [1, 10, etc.] and unitId.
const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const User = require('../models/User');
const Unit = require('../models/Unit');
const Task = require('../models/Task');
const CadenceLog = require('../models/CadenceLog');
const ContactAttempt = require('../models/ContactAttempt');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { checkUnitIsolation } = require('../utils/unitIsolation');
const { ROLE_IDS } = require('../config/roles');

// GET /api/crm/stats/top-seller
router.get('/stats/top-seller', auth, async (req, res) => {
    try {
        const { unitId, role } = req.user;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Filter for sales in current month
        const where = {
            status: 'won',
            updatedAt: { [Op.between]: [startOfMonth, endOfMonth] }
        };

        // Unit filtering
        const isGlobal = [1, 10].includes(Number(req.user.roleId));
        if (!isGlobal) {
            where.unitId = unitId;
        }

        // Fetch leads
        const leads = await Lead.findAll({
            where,
            attributes: ['consultant_id']
        });

        if (leads.length === 0) return res.json(null); // No sales

        // Count sales
        const counts = {};
        leads.forEach(l => {
            if (l.consultant_id) {
                counts[l.consultant_id] = (counts[l.consultant_id] || 0) + 1;
            }
        });

        // Find max
        let topConsultantId = null;
        let maxSales = -1;
        for (const [id, count] of Object.entries(counts)) {
            if (count > maxSales) {
                maxSales = count;
                topConsultantId = id;
            }
        }

        if (!topConsultantId) return res.json(null);

        // Fetch User details
        const topSeller = await User.findByPk(topConsultantId, {
            attributes: ['id', 'name', 'profilePicture', 'role', 'unitId']
        });

        if (!topSeller) return res.json(null);

        res.json({
            ...topSeller.toJSON(),
            salesCount: maxSales,
            month: now.toLocaleString('pt-BR', { month: 'long' })
        });

    } catch (error) {
        console.error('Top Seller Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- Helper: Simulated AI Actions ---
const createEnrollmentTask = async (lead, requester, transaction = null) => {
    try {
        const { ROLE_IDS } = require('../config/roles');

        // 1. Check if enrollment task already exists
        const existingTask = await Task.findOne({
            where: {
                leadId: lead.id,
                title: { [Op.like]: 'Matricular Aluno%' }
            },
            transaction
        });

        // 2. If already exists, update and reopen if needed
        if (existingTask) {
            // Close OTHER pending tasks first to ensure exclusivity
            await Task.update({ status: 'done' }, {
                where: {
                    leadId: lead.id,
                    status: 'pending',
                    id: { [Op.ne]: existingTask.id }
                },
                transaction
            });

            await existingTask.update({
                status: 'pending',
                dueDate: new Date(),
                title: `Matricular Aluno: ${lead.name}`, // Update name if changed
                userId: existingTask.userId || assigneeId, // Keep current or assign
                description: existingTask.description + '\n\n[Atualizada via Re-importação]'
            }, { transaction });
            return;
        }

        // 3. New Task: Close all other pending tasks for this lead first
        await Task.update({ status: 'done' }, {
            where: { leadId: lead.id, status: 'pending' },
            transaction
        });

        // 2. Find Assignee (Admin -> Manager -> Franchisee)
        const rolesToSearch = [ROLE_IDS.ADMIN_FINANCIAL, ROLE_IDS.MANAGER, ROLE_IDS.FRANCHISEE];
        let assigneeId = null;

        for (const roleId of rolesToSearch) {
            const user = await User.findOne({
                where: { unitId: lead.unitId, roleId },
                transaction
            });
            if (user) {
                assigneeId = user.id;
                break;
            }
        }

        // Fallback to requester
        if (!assigneeId) assigneeId = requester.id;

        // 3. Create Task
        await Task.create({
            title: `Matricular Aluno: ${lead.name}`,
            description: `Ação Automática: O lead foi matriculado pelo comercial. Favor realizar a matrícula oficial no sistema pedagógico e conferir os dados financeiros.\nID do Lead: ${lead.id}`,
            dueDate: new Date(),
            priority: 'high',
            status: 'pending',
            leadId: lead.id,
            userId: assigneeId,
            unitId: lead.unitId,
            category: 'administrative'
        }, { transaction });

        console.log(`✅ Enrollment task created for lead ${lead.id} assigned to ${assigneeId}`);
    } catch (error) {
        console.error('❌ Error creating enrollment task:', error);
    }
};

const executeAIAction = async (lead, actionType) => {
    let message = '';
    const now = new Date();

    if (actionType === 'welcome') {
        message = `Oi ${lead.name}, tudo bem? Aqui é a Julia da Vox2You! Vi que você se interessou pelo nosso curso de oratória. Posso te explicar como funciona?`;
    } else if (actionType === 'followup_1') {
        message = `E aí ${lead.name}, conseguiu ver minha mensagem anterior?`;
    } else if (actionType === 'reactivation') {
        message = `Olá ${lead.name}, notamos que você não conseguiu comparecer à consultoria. Aconteceu algum imprevisto? Vamos reagendar?`;
    }

    // Update Lead Log
    const history = JSON.parse(lead.history || '[]');
    history.push({
        date: now.toISOString(),
        actor: 'AI',
        action: 'sent_message',
        content: message
    });

    // Check Max Attempts (5)
    const newAttemptCount = lead.attemptCount + 1;
    let newStatus = lead.status;
    let nextAction = new Date(now.getTime() + 12 * 60 * 60 * 1000); // Default 12h

    if (newAttemptCount >= 5) {
        newStatus = 'archived'; // Encerrar atendimento
        nextAction = null; // Stop cadence
        history.push({
            date: now.toISOString(),
            actor: 'SYSTEM',
            action: 'auto_archive',
            content: 'Atendimento encerrado automaticamente após 5 tentativas sem sucesso.'
        });
    }

    await lead.update({
        history: JSON.stringify(history),
        lastContactAt: now,
        attemptCount: newAttemptCount,
        status: newStatus,
        nextActionAt: nextAction
    });

    return message;
};



// GET /api/crm/leads - List all leads (Filtered by Role)
router.get('/leads', auth, async (req, res) => {
    try {
        const { roleId, unitId, id } = req.user;
        const where = { deletedAt: null };

        // 1. Consultant (41) - Strict isolation
        if (roleId === ROLE_IDS.CONSULTANT) {
            where.consultant_id = id;
        }
        // 2. Unit Leadership (20, 30, 40) - Unit isolation
        else if ([ROLE_IDS.FRANCHISEE, ROLE_IDS.MANAGER, ROLE_IDS.LEADER_SALES].includes(roleId)) {
            where.unitId = unitId;
        }
        // 3. Global (1, 10) - All access
        else if ([ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(Number(roleId))) {
            // Can see all, but respect unitId filter if sent
            if (req.query.unitId && req.query.unitId !== 'all') where.unitId = Number(req.query.unitId);
        }
        else {
            // Others (Pedagogical etc) should not see leads?
            // Unless explicitly allowed. For now, empty.
            return res.json([]);
        }

        // Apply Date Filters (if provided and valid)
        if (req.query.startDate && req.query.endDate && req.query.startDate !== '' && req.query.endDate !== '') {
            const { Op } = require('sequelize');
            const start = new Date(req.query.startDate);
            const end = new Date(req.query.endDate);

            // Validate dates
            if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                end.setHours(23, 59, 59, 999);
                where.createdAt = { [Op.between]: [start, end] };
            }
        }

        const leads = await Lead.findAll({
            where,
            attributes: { exclude: ['history', 'tracking', 'metadata', 'attempts', 'notes', 'contactSummary', 'painPoint'] },
            include: [
                { model: Unit, attributes: ['name'] },
                { model: User, as: 'consultant', attributes: ['name', 'roleId'] },
                {
                    model: Task,
                    as: 'tasks',
                    required: false,
                    where: { status: 'pending' },
                    attributes: ['dueDate', 'status']
                }
            ],
            order: [['updatedAt', 'DESC']]
        });

        // Map associations to flat lead object for frontend compatibility
        const mappedLeads = leads.map(l => {
            const plain = l.get({ plain: true });

            // Calculate Next Task Date (Newest/Furthest Pending Task)
            let nextTaskDate = null;
            if (plain.tasks && plain.tasks.length > 0) {
                // Sort tasks by due date (DESC) as requested to get the 'newest'
                const sorted = plain.tasks.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
                nextTaskDate = sorted[0].dueDate;
            }

            return {
                ...plain,
                unit: plain.Unit?.name || 'Unidade Atual',
                responsible: plain.consultant?.name || 'Sem Dono',
                responsibleRoleId: plain.consultant?.roleId,
                nextTaskDate // Send calculated date to frontend
            };
        });

        res.json(mappedLeads);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/crm/leads/:id - Get Single Lead Details
router.get('/leads/:id', auth, async (req, res) => {
    try {
        const { id, roleId, unitId } = req.user;
        const lead = await Lead.findByPk(req.params.id, {
            include: [
                { model: Unit, attributes: ['name'] },
                { model: User, as: 'consultant', attributes: ['name', 'roleId'] },
                { model: CadenceLog, as: 'cadenceLogs' },
                { model: ContactAttempt, as: 'contactAttempts' },
                { model: Task, as: 'tasks' }
            ]
        });

        if (!lead) return res.status(404).json({ error: 'Lead not found' });

        const leadData = lead.get({ plain: true });

        // Permission Check
        // 1. Consultant: Must be owner
        if (roleId === ROLE_IDS.CONSULTANT) {
            if (leadData.consultant_id !== id) {
                return res.status(403).json({ error: 'Acesso negado. Você não é o responsável por este lead.' });
            }
        }
        // 2. Unit Admin: Must belong to unit
        else if ([ROLE_IDS.FRANCHISEE, ROLE_IDS.MANAGER, ROLE_IDS.LEADER_SALES].includes(roleId)) {
            if (leadData.unitId && leadData.unitId !== unitId) {
                return res.status(403).json({ error: 'Acesso negado. Lead de outra unidade.' });
            }
        }

        res.json({
            ...leadData,
            unit: leadData.Unit?.name || 'Unidade Atual',
            responsible: leadData.consultant?.name || 'Sem Dono',
            responsibleRoleId: leadData.consultant?.roleId
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Helper for safe date parsing
const parseDateSafe = (val) => {
    if (!val) return null;
    const d = new Date(val);
    if (isNaN(d.getTime())) return null; // Invalid Date
    return d;
};

// POST /api/crm/leads - Create new Lead (Manual)
router.post('/leads', auth, async (req, res) => {
    try {
        const {
            name, phone, email, source, campaign,
            title, value, company, city, neighborhood, tags,
            attempts, contactSummary, nextTaskType, observation,
            unitId, responsibleId, temperature, appointmentDate, nextTaskDate,
            // Extended Data
            cpf, rg, birthDate, profession, address, courseInterest, lossReason, tracking, metadata, createdAt,
            // SPIN & Negotiation
            painPoint, objective, proposalPlan, proposalValue, paymentConditions, consultancyDate, consultancyType
        } = req.body;

        const requester = req.user;

        // Use provided unitId or fallback to requester's unitId
        let finalUnitId = unitId || requester.unitId;

        // Security: Non-globals restricted
        const isGlobal = [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(Number(requester.roleId));
        if (!isGlobal) {
            // Priority: User Token > Body > Null
            if (requester.unitId) {
                finalUnitId = requester.unitId;
            } else if (unitId) {
                // Fallback for franchisees with issue in token (from ImportModal)
                finalUnitId = unitId;
            } else {
                // No unit found anywhere
            }
        }

        // Fallback for Global Users creating without Unit ID -> Default to Unit 1 (Matriz/First)
        if (!finalUnitId && isGlobal) {
            finalUnitId = 1;
        }

        // Clean Value
        const cleanValue = value ? Number(String(value).replace(/[^0-9.-]/g, '')) : 0;

        const lead = await Lead.create({
            name: name || 'Sem Nome', // Fallback to prevent NN constraint
            phone: phone || '0000000000', // Fallback
            email,
            source: source || 'Orgânico', // Explicitly set source
            campaign,
            title,
            value: isNaN(cleanValue) ? 0 : cleanValue,
            company,
            createdAt: parseDateSafe(createdAt) || new Date(), // Allow overwrite or default
            city,
            neighborhood,
            tags: Array.isArray(tags) ? JSON.stringify(tags) : tags,
            attempts: typeof attempts === 'object' ? JSON.stringify(attempts) : (attempts || '[]'),
            contactSummary,
            nextTaskType,
            nextTaskDate: parseDateSafe(nextTaskDate),
            appointmentDate: parseDateSafe(appointmentDate),
            notes: observation,

            unitId: finalUnitId ? Number(finalUnitId) : null,
            consultant_id: responsibleId || requester.id,
            status: req.body.status || 'new',
            handledBy: (req.body.status && req.body.status !== 'new') ? 'HUMAN' : 'AI',
            temperature: temperature || 'cold',

            // New Fields Mapping
            cpf,
            rg,
            birthDate: parseDateSafe(birthDate),
            profession,
            address,
            courseInterest,
            lossReason,
            tracking: typeof tracking === 'object' ? JSON.stringify(tracking) : tracking,
            metadata: typeof metadata === 'object' ? JSON.stringify(metadata) : metadata,

            // SPIN & Sales
            painPoint,
            objective,
            proposalPlan,
            proposalValue,
            paymentConditions,
            consultancyDate: parseDateSafe(consultancyDate),
            consultancyType: consultancyType || 'presencial',

            history: JSON.stringify([{
                date: new Date().toISOString(),
                actor: 'HUMAN',
                action: 'create',
                content: 'Lead criado manualmente via Kanban'
            }])
        });

        // AUTO-TASK GENERATION for New Leads
        const Task = require('../models/Task');
        try {
            // 1. Scheduled
            if (req.body.status === 'scheduled') {
                await Task.create({
                    title: `Reunião: ${lead.name}`,
                    description: `Sessão agendada durante o cadastro/importação.`,
                    dueDate: parseDateSafe(appointmentDate) || new Date(),
                    priority: 'high',
                    status: 'pending',
                    leadId: lead.id,
                    userId: lead.consultant_id || requester.id,
                    unitId: lead.unitId || requester.unitId,
                    category: 'commercial'
                });
            }
            // 2. Connecting
            else if (req.body.status === 'connecting') {
                await Task.create({
                    title: `Retentativa: ${lead.name}`,
                    description: `Lead importado/criado na fase de Conexão.`,
                    dueDate: new Date(), // Immediate
                    priority: 'high',
                    status: 'pending',
                    leadId: lead.id,
                    userId: lead.consultant_id || requester.id,
                    unitId: lead.unitId || requester.unitId,
                    category: 'commercial'
                });
            }
            // 3. Negotiation
            else if (req.body.status === 'negotiation') {
                await Task.create({
                    title: `Negociação: ${lead.name}`,
                    description: `Lead importado/criado em Negociação.`,
                    dueDate: new Date(), // Immediate
                    priority: 'high',
                    status: 'pending',
                    leadId: lead.id,
                    userId: lead.consultant_id || requester.id,
                    unitId: lead.unitId || requester.unitId,
                    category: 'commercial'
                });
            }
            // 4. No-Show
            else if (req.body.status === 'no_show') {
                await Task.create({
                    title: `No Show: ${lead.name}`,
                    description: `Lead importado/criado como No-Show.`,
                    dueDate: new Date(), // Immediate
                    priority: 'high',
                    status: 'pending',
                    leadId: lead.id,
                    userId: lead.consultant_id || requester.id,
                    unitId: lead.unitId || requester.unitId,
                    category: 'commercial'
                });
            }
            // 5. Default (New Lead) - Only if NOT won/closed and NO appointment
            else if (!['won', 'closed', 'lost', 'archived'].includes(lead.status) && !appointmentDate) {
                await Task.create({
                    title: `Iniciar Conexão: ${lead.name}`,
                    description: `Novo lead cadastrado. Iniciar primeiro contato. Ref: ${source || 'Orgânico'}`,
                    dueDate: new Date(),
                    priority: 'high',
                    status: 'pending',
                    leadId: lead.id,
                    userId: lead.consultant_id || requester.id,
                    unitId: lead.unitId || requester.unitId,
                    category: 'commercial'
                });
            }
        } catch (taskError) {
            console.error('Error creating initial task:', taskError);
        }

        const savedLead = await Lead.findByPk(lead.id, {
            include: [
                { model: Unit, attributes: ['name'] },
                { model: User, as: 'consultant', attributes: ['name', 'roleId'] }
            ]
        });

        const responseLead = savedLead.get({ plain: true });
        res.status(201).json({
            ...responseLead,
            unit: responseLead.Unit?.name || 'Unidade Atual',
            responsible: responseLead.consultant?.name || 'Sem Dono',
            responsibleRoleId: responseLead.consultant?.roleId
        });
    } catch (error) {
        console.error('Error creating lead:', error);

        // Log detailed error to file for debugging
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, '../last_lead_post_error.log');
        const logContent = `
Time: ${new Date().toISOString()}
User: ${JSON.stringify(req.user)}
Body: ${JSON.stringify(req.body)}
Error: ${error.message}
Stack: ${error.stack}
Validation Errors: ${JSON.stringify(error.errors || [])}
----------------------------------------
`;
        try {
            fs.appendFileSync(logPath, logContent);
        } catch (e) { console.error('Failed to write log:', e); }

        res.status(500).json({
            error: 'Erro ao criar lead',
            details: error.errors ? error.errors.map(e => e.message).join(', ') : error.message
        });
    }
});

// PUT /api/crm/leads/:id - Update Lead
router.put('/leads/:id', auth, async (req, res) => {
    try {
        const lead = await Lead.findByPk(req.params.id);
        if (!lead) return res.status(404).json({ error: 'Lead not found' });

        // Unit Isolation check
        if (!checkUnitIsolation(res, req.user, lead.unitId)) return;

        const {
            name, phone, email, source, campaign,
            title, value, company, city, neighborhood, tags,
            attempts, contactSummary, nextTaskType, observation,
            unitId, responsibleId, temperature, nextTaskDate, appointmentDate,
            // Extended Data
            cpf, rg, birthDate, profession, address, courseInterest, lossReason, tracking, metadata,
            // SPIN & Negotiation
            painPoint, objective, proposalPlan, proposalValue, paymentConditions, consultancyDate, consultancyType,
            // Importado alignment
            sdr_id, quantity, secondary_phone, secondary_email, position, cnpj, organization_id, bank_code, real_address,
            connection_done, connection_date, connection_channel, enrollmentDate,
            sales_value, material_value, enrollment_value, payment_method, installments, card_brand
        } = req.body;

        const history = JSON.parse(lead.history || '[]');
        history.push({
            date: new Date().toISOString(),
            actor: 'HUMAN',
            action: 'update',
            content: 'Atualização Manual de Dados'
        });

        // Capture Old Consultant ID for Task Transfer Check
        const oldConsultantId = lead.consultant_id;

        await lead.update({
            history: JSON.stringify(history),
            name,
            phone,
            email,
            source,
            campaign,
            title,
            value: value !== undefined ? Number(String(value).replace(/[^0-9.-]/g, '')) : lead.value,
            company,
            city,
            neighborhood,
            tags: (() => {
                if (tags === undefined) return lead.tags;
                if (Array.isArray(tags)) return JSON.stringify(tags);
                if (typeof tags === 'string') {
                    // If already a JSON string, parse and re-stringify to normalize
                    try {
                        const parsed = JSON.parse(tags);
                        return JSON.stringify(Array.isArray(parsed) ? parsed : [tags]);
                    } catch {
                        // If not valid JSON, treat as comma-separated string
                        return JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean));
                    }
                }
                return lead.tags;
            })(),
            attempts: typeof attempts === 'object' ? JSON.stringify(attempts) : attempts,
            contactSummary,
            nextTaskType,
            nextTaskDate: nextTaskDate ? new Date(nextTaskDate) : lead.nextTaskDate,
            appointmentDate: appointmentDate ? new Date(appointmentDate) : lead.appointmentDate,
            notes: observation,
            unitId: unitId !== undefined ? (unitId ? Number(unitId) : null) : lead.unitId,
            consultant_id: responsibleId || lead.consultant_id,
            status: req.body.status || lead.status,
            temperature: temperature || lead.temperature,

            // New & Personal Fields
            cpf,
            rg,
            birthDate: parseDateSafe(birthDate) || lead.birthDate,
            profession,
            address,
            courseInterest,
            lossReason,
            tracking: typeof tracking === 'object' ? JSON.stringify(tracking) : tracking,
            metadata: (() => {
                if (metadata === undefined) return lead.metadata;
                if (typeof metadata === 'string') return metadata;
                // Merge with existing metadata
                const existing = lead.metadata ? (typeof lead.metadata === 'string' ? JSON.parse(lead.metadata) : lead.metadata) : {};
                const updated = typeof metadata === 'object' ? metadata : {};
                return JSON.stringify({ ...existing, ...updated });
            })(),

            // SPIN & Sales
            painPoint,
            objective,
            proposalPlan,
            proposalValue,
            paymentConditions,
            consultancyType,
            consultancyDate: parseDateSafe(req.body.consultancyDate) || lead.consultancyDate,
            enrollmentDate: parseDateSafe(enrollmentDate) || lead.enrollmentDate,

            // Importado alignment
            sdr_id: sdr_id ? Number(sdr_id) : lead.sdr_id,
            quantity: quantity ? Number(quantity) : lead.quantity,
            secondary_phone,
            secondary_email,
            position,
            cnpj,
            organization_id,
            bank_code,
            real_address,
            connection_done: connection_done !== undefined ? connection_done : lead.connection_done,
            connection_date: parseDateSafe(connection_date) || lead.connection_date,
            connection_channel,
            sales_value: sales_value !== undefined ? Number(sales_value) : lead.sales_value,
            material_value: material_value !== undefined ? Number(material_value) : lead.material_value,
            enrollment_value: enrollment_value !== undefined ? Number(enrollment_value) : lead.enrollment_value,
            payment_method,
            installments,
            card_brand,
            adData: req.body.adData !== undefined ? req.body.adData : lead.adData
        });

        // Task Transfer Logic (If Responsible Changed)
        if (responsibleId && Number(responsibleId) !== oldConsultantId) {
            const Task = require('../models/Task');
            await Task.update(
                { userId: responsibleId },
                {
                    where: {
                        leadId: lead.id,
                        status: 'pending' // Only transfer pending tasks
                    }
                }
            );
        }

        const updatedLead = await Lead.findByPk(lead.id, {
            include: [
                { model: Unit, attributes: ['name'] },
                { model: User, as: 'consultant', attributes: ['name', 'roleId'] }
            ]
        });

        const responseLead = updatedLead.get({ plain: true });
        res.json({
            ...responseLead,
            unit: responseLead.Unit?.name || 'Unidade Atual',
            responsible: responseLead.consultant?.name || 'Sem Dono',
            responsibleRoleId: responseLead.consultant?.roleId
        });
    } catch (error) {
        console.error('Error updating lead:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/crm/leads/:id/move - Move card in Kanban
router.put('/leads/:id/move', auth, async (req, res) => {
    try {
        const { status, funnel, notes, proposedValue, appointmentDate, nextTaskDate, nextTaskType } = req.body;
        const lead = await Lead.findByPk(req.params.id);

        if (!lead) return res.status(404).json({ error: 'Lead not found' });

        // Unit Isolation check
        if (!checkUnitIsolation(res, req.user, lead.unitId)) return;

        const currentStatus = lead.status;
        const now = new Date();

        const STATUS_LABELS = {
            'new': 'Novo Lead',
            'connecting': 'Tentativa de Contato',
            'connected': 'Conectado',
            'scheduled': 'Agendado',
            'negotiation': 'Negociação',
            'won': 'Venda Realizada',
            'lost': 'Perdido',
            'no_show': 'Não Compareceu',
            'closed': 'Arquivado'
        };

        let updates = { status };
        if (funnel) updates.funnel = funnel;

        // Handle Extra Data
        if (notes) updates.notes = notes;
        if (appointmentDate) updates.appointmentDate = new Date(appointmentDate);
        if (nextTaskDate) updates.nextTaskDate = new Date(nextTaskDate);
        if (nextTaskType) updates.nextTaskType = nextTaskType;
        if (proposedValue) updates.value = Number(String(proposedValue).replace(/[^0-9.-]/g, ''));

        if (req.body.incrementAttempts) {
            let currentAttempts = [];
            try {
                currentAttempts = lead.attempts ? JSON.parse(lead.attempts) : [];
                // Handle case where it might be just a string or number in legacy data
                if (!Array.isArray(currentAttempts)) currentAttempts = [];
            } catch (e) {
                currentAttempts = [];
            }

            currentAttempts.push({
                date: now.toISOString(),
                outcome: 'failure',
                note: notes || 'Tentativa registrada via Kanban'
            });

            updates.attempts = JSON.stringify(currentAttempts);
            updates.attemptCount = currentAttempts.length;
        }

        // Log Transition
        const history = JSON.parse(lead.history || '[]');
        let logContent = '';

        if (req.body.incrementAttempts) {
            const currentAttempts = updates.attempts ? JSON.parse(updates.attempts) : [];
            logContent = `Tentativa de contato #${currentAttempts.length} realizada.`;
        } else if (currentStatus !== status) {
            const oldLabel = STATUS_LABELS[currentStatus] || currentStatus;
            const newLabel = STATUS_LABELS[status] || status;
            if (status === 'no_show') {
                logContent = `No Show: O lead não compareceu ao compromisso.`;
            } else {
                logContent = `Alterou status de "${oldLabel}" para "${newLabel}".`;
            }
        } else {
            logContent = `Atualização de dados no card.`;
        }

        if (notes) logContent += ` Obs: ${notes}.`;
        if (proposedValue) logContent += ` Valor: ${proposedValue}.`;
        if (appointmentDate) logContent += ` Agendado para: ${new Date(appointmentDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.`;
        if (nextTaskDate) logContent += ` Próxima tarefa (${nextTaskType}) agendada para: ${new Date(nextTaskDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}.`;

        history.push({
            date: now.toISOString(),
            actor: 'HUMAN',
            action: 'move_stage',
            content: logContent
        });

        updates.history = JSON.stringify(history);

        // Logic: Switch AI/Human based on column
        if (['new', 'connecting', 'no_show'].includes(status)) {
            updates.handledBy = 'AI';
            updates.aiStatus = 'active'; // Always active in these stages
        } else if (['connected', 'scheduled', 'negotiation'].includes(status)) {
            updates.handledBy = 'HUMAN';
            updates.aiStatus = 'active'; // Always active in these stages
            // Auto-assign to current user if unassigned
            if (!lead.consultant_id) {
                updates.consultant_id = req.user.id;
            }
        } else if (status === 'won') {
            updates.handledBy = 'HUMAN';
            updates.aiStatus = 'matriculado'; // Special status for won leads
        } else if (status === 'closed') {
            updates.handledBy = 'HUMAN';
            updates.aiStatus = 'inactive'; // Special status for closed/archived leads
        }

        // AUTO-TASK GENERATION
        const Task = require('../models/Task'); // Lazy load

        // New Logic: Complete ALL previous pending tasks for this lead if move to new stage or terminal state.
        // This ensures only the LATEST task is active OR no tasks are active for Won/Closed leads.
        if (appointmentDate || nextTaskDate || ['won', 'closed'].includes(status)) {
            await Task.update(
                { status: 'done' },
                {
                    where: {
                        leadId: lead.id,
                        status: 'pending'
                    }
                }
            );
        }
        // Auto-Task Logic based on Status Change
        try {
            // SKIP INTERNAL FUNNEL
            if (status && status.startsWith('internal')) {
                // Do not create auto tasks
            } else {
                // 1. If moving to Scheduled -> Create Meeting Task
                if (status === 'scheduled' && appointmentDate) {
                    await Task.create({
                        title: `Reunião: ${lead.name}`,
                        description: `Agendada para: ${new Date(appointmentDate).toLocaleString('pt-BR')}. \n${logContent}`,
                        dueDate: new Date(appointmentDate),
                        priority: 'high',
                        status: 'pending',
                        leadId: lead.id,
                        userId: lead.consultant_id || updates.consultant_id || req.user.id,
                        unitId: lead.unitId || req.user.unitId,
                        category: 'commercial' // Commercial Task
                    });
                }

                // 2. If moving to Connecting with Failure (Automated Retry) or No-Show
                if ((status === 'connecting' || status === 'no_show') && nextTaskDate) {
                    await Task.create({
                        title: status === 'no_show' ? `No Show: ${lead.name}` : `Retentativa: ${lead.name}`,
                        description: logContent, // Use the real log info
                        dueDate: new Date(nextTaskDate),
                        priority: 'high',
                        status: 'pending',
                        leadId: lead.id,
                        userId: lead.consultant_id || updates.consultant_id || req.user.id,
                        unitId: lead.unitId || req.user.unitId,
                        category: 'commercial'
                    });
                }

                // 3. If Negotiation -> Create High Priority Negotiation Task
                if (status === 'negotiation' && nextTaskDate) {
                    await Task.create({
                        title: `Negociação: ${lead.name}`,
                        description: logContent, // Use the real log info
                        dueDate: new Date(nextTaskDate),
                        priority: 'high',
                        status: 'pending',
                        leadId: lead.id,
                        userId: lead.consultant_id || updates.consultant_id || req.user.id,
                        unitId: lead.unitId || req.user.unitId,
                        category: 'commercial'
                    });
                }
            }
        } catch (taskError) {
            console.error('Error creating auto-task:', taskError);
            // Don't block the main update response, but log it.
        }

        // 4. If moving to WON -> Create Enrollment Task for Administrative & Send Conversion Signal
        if (status === 'won' && currentStatus !== 'won') {
            await createEnrollmentTask(lead, req.user);

            // TRIGGERS OFFLINE CONVERSION SIGNAL
            try {
                const { sendConversionSignal } = require('../services/conversionService');
                const saleValue = updates.value || lead.value || 0;
                await sendConversionSignal(lead, saleValue);
            } catch (e) {
                console.error('[CONVERSION ERROR] Failed to send signal:', e.message);
            }
        }



        // Logic: Reset attempts if moving to No-Show to start reactivation cadence
        if (status === 'no_show' && currentStatus !== 'no_show') {
            updates.attemptCount = 0;
            // Immediate Trigger if executeAIAction exists
            try {
                const { executeAIAction } = require('../services/aiService');
                await executeAIAction(lead, 'reactivation');
            } catch (e) { console.log('AI Action skipped: service not found'); }
        }

        await lead.update(updates);

        const updatedLead = await Lead.findByPk(lead.id, {
            include: [
                { model: Unit, attributes: ['name'] },
                { model: User, as: 'consultant', attributes: ['name', 'roleId'] }
            ]
        });

        const responseLead = updatedLead.get({ plain: true });
        res.json({
            ...responseLead,
            unit: responseLead.Unit?.name || 'Unidade Atual',
            responsible: responseLead.consultant?.name || 'Sem Dono',
            responsibleRoleId: responseLead.consultant?.roleId
        });

    } catch (error) {
        console.error('Move error:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/crm/leads/:id - Delete Lead
// POST /api/crm/leads/bulk-delete - Helper for Mass Deletion
router.post('/leads/bulk-delete', auth, async (req, res) => {
    try {
        const { leadIds } = req.body;
        console.log('🗑️ Bulk SOFT delete request:', { leadIds, count: leadIds?.length });

        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ error: 'Nenhum lead selecionado.' });
        }

        // Soft Delete: Apenas marca deletedAt
        const now = new Date();
        const updatedCount = await Lead.update(
            { deletedAt: now },
            { where: { id: { [Op.in]: leadIds } } }
        );

        res.json({
            success: true,
            message: `${updatedCount} leads movidos para a lixeira temporária.`,
            meta: { undoAvailable: true, timeoutSeconds: 600 }
        });

    } catch (error) {
        console.error('❌ Bulk Soft Delete Error:', error);
        res.status(500).json({ error: 'Erro ao excluir leads: ' + error.message });
    }
});

// POST /api/crm/leads/undo-delete - Restore recently deleted leads
router.post('/leads/undo-delete', auth, async (req, res) => {
    try {
        const { leadIds } = req.body;
        console.log('♻️ Undo delete request:', { leadIds });

        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ error: 'Nenhum lead para restaurar.' });
        }

        await Lead.update(
            { deletedAt: null },
            { where: { id: { [Op.in]: leadIds } } }
        );

        res.json({ success: true, message: 'Leads restaurados com sucesso.' });
    } catch (error) {
        console.error('❌ Undo Delete Error:', error);
        res.status(500).json({ error: 'Erro ao restaurar leads.' });
    }
});

// AUTOMATIC CLEANUP TASK (Runs every 1 minute)
// Permanently deletes leads that have been in 'deletedAt' for more than 10 minutes
setInterval(async () => {
    try {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

        // Find candidates for hard delete
        const leadsToDelete = await Lead.findAll({
            where: {
                deletedAt: { [Op.lt]: tenMinutesAgo }
            },
            attributes: ['id']
        });

        if (leadsToDelete.length > 0) {
            const ids = leadsToDelete.map(l => l.id);
            console.log(`🧹 Auto-Cleanup: Permanently removing ${ids.length} leads...`);

            // Perform cascades (simulated manually if simple truncate doesn't work, but constraints should fail if naive)
            // Ideally use individual destroys or cascade config.
            // For now, mirroring the manual hard delete logic:

            await Task.destroy({ where: { leadId: { [Op.in]: ids } } });
            await ContactAttempt.destroy({ where: { leadId: { [Op.in]: ids } } });
            await CadenceLog.destroy({ where: { leadId: { [Op.in]: ids } } });
            await Lead.destroy({ where: { id: { [Op.in]: ids } }, force: true }); // force: true just in case paranoid is ever enabled

            console.log('✨ Auto-Cleanup Complete.');
        }
    } catch (e) {
        console.error('⚠️ Auto-Cleanup Error:', e.message);
    }
}, 60000); // Check every minute


router.delete('/leads/:id', auth, async (req, res) => {
    try {
        const lead = await Lead.findByPk(req.params.id);
        if (!lead) return res.status(404).json({ error: 'Lead not found' });

        // Unit Isolation check
        if (!checkUnitIsolation(res, req.user, lead.unitId)) return;

        // Basic permission check: only creator or unit admin or master
        // For now, allow all authenticated (standard for this project's current state)

        // Manual Cascade (Safety)
        await Task.destroy({ where: { leadId: lead.id } });

        await lead.destroy();
        res.json({ success: true, message: 'Lead excluído com sucesso' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/crm/cadence/run - Run Cron Job for AI (Simulated)
router.post('/cadence/run', async (req, res) => {
    try {
        const now = new Date();

        // Find leads handled by AI that are due for contact
        // Rules: active AI, not closed, nextActionAt is passed or null (new), attemptCount < 5
        const leads = await Lead.findAll({
            where: {
                handledBy: 'AI',
                status: { [Op.notIn]: ['won', 'closed', 'scheduled', 'negotiation', 'connected'] }, // Only run on new/connecting/no_show
                attemptCount: { [Op.lt]: 5 },
                [Op.or]: [
                    { nextActionAt: { [Op.lte]: now } },
                    { nextActionAt: null }
                ]
            }
        });

        let processed = 0;
        for (const lead of leads) {
            await executeAIAction(lead, 'followup_1');
            processed++;
        }

        // Close Leads with > 5 attempts
        const expiredLeads = await Lead.findAll({
            where: {
                handledBy: 'AI',
                status: { [Op.notIn]: ['won', 'closed'] },
                attemptCount: { [Op.gte]: 5 }
            }
        });

        for (const lead of expiredLeads) {
            await lead.update({ status: 'closed', notes: 'Encerrado automaticamente pela IA após 5 tentativas sem resposta.' });
        }

        res.json({ message: 'Cadence ran', processed, expired: expiredLeads.length });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/crm/leads/:id/takeover - Human takes over AI
router.post('/leads/:id/takeover', auth, async (req, res) => {
    try {
        const lead = await Lead.findByPk(req.params.id);
        if (!lead) return res.status(404).json({ error: 'Lead not found' });

        // Unit Isolation check
        if (!checkUnitIsolation(res, req.user, lead.unitId)) return;

        await lead.update({ handledBy: 'HUMAN' });

        // Log event
        const history = JSON.parse(lead.history || '[]');
        history.push({
            date: new Date().toISOString(),
            actor: 'HUMAN',
            action: 'takeover',
            content: 'Atendimento humano assumido.'
        });
        await lead.update({ history: JSON.stringify(history) });

        res.json(lead);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/crm/leads/:id/interaction - Record a manual or system interaction (Call, Msg)
router.post('/leads/:id/interaction', auth, async (req, res) => {
    try {
        const { type, content } = req.body; // type: 'call', 'whatsapp', 'email'
        const lead = await Lead.findByPk(req.params.id);

        if (!lead) return res.status(404).json({ error: 'Lead not found' });

        // Unit Isolation check
        if (!checkUnitIsolation(res, req.user, lead.unitId)) return;

        const now = new Date();
        const history = JSON.parse(lead.history || '[]');

        history.push({
            date: now.toISOString(),
            actor: 'HUMAN', // or 'AI' if passed
            action: type,
            content: content || 'Interação registrada manualmente.'
        });

        const updates = {
            history: JSON.stringify(history),
            lastContactAt: now,
            attemptCount: lead.attemptCount + 1 // Increment attempts? Or maybe reset if successful contact?
        };

        // AUTOMATION: If Lead is NEW and we interacted, move to Connecting
        if (lead.status === 'new') {
            updates.status = 'connecting';
            updates.handledBy = 'HUMAN'; // Assuming human logged the interaction usually
        }

        // AUTOMATION: If Lead was No-Show and we contacted, move to Connecting
        if (lead.status === 'no_show') {
            updates.status = 'connecting';
        }

        await lead.update(updates);

        res.json(lead);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Data Tools: Export/Import ---

// Allowed Roles Middleware for Data Tools
const checkDataToolsAccess = (req, res, next) => {
    // 1-Master, 10-Director, 20-Franchisee, 30-Manager, 40-SalesLeader, 50-PedagLeader, 60-AdminFinancial
    const allowedRoles = [1, 10, 20, 30, 40, 50, 60];
    if (!allowedRoles.includes(Number(req.user.roleId))) {
        return res.status(403).json({ error: 'Acesso negado. Apenas Liderança tem acesso a ferramentas de dados.' });
    }
    next();
};

// GET /api/crm/export/csv
router.get('/export/csv', auth, checkDataToolsAccess, async (req, res) => {
    try {
        const { unitId } = req.user;
        const where = {};
        const isGlobal = [1, 10].includes(Number(req.user.roleId));
        if (!isGlobal) where.unitId = unitId;

        const leads = await Lead.findAll({ where, raw: true });

        // CSV Header
        const fields = ['name', 'email', 'phone', 'status', 'source', 'campaign', 'createdAt'];
        let csv = fields.join(',') + '\n';

        // CSV Rows
        leads.forEach(lead => {
            const row = fields.map(field => {
                let val = lead[field] || '';
                if (field === 'createdAt') val = new Date(val).toLocaleDateString('pt-BR');
                // Escape commas and quotes
                val = String(val).replace(/"/g, '""');
                if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                    val = `"${val}"`;
                }
                return val;
            });
            csv += row.join(',') + '\n';
        });

        res.header('Content-Type', 'text/csv');
        res.attachment(`leads_export_${new Date().getTime()}.csv`);
        res.send(csv);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/crm/import/csv
router.post('/import/csv', auth, checkDataToolsAccess, async (req, res) => {
    try {
        const { csvContent } = req.body; // Expect raw CSV string
        const { unitId, role } = req.user;

        if (!csvContent) return res.status(400).json({ error: 'Conteúdo CSV inválido.' });

        const lines = csvContent.split(/\r?\n/);
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

        // Basic map of expected headers
        // Just assuming consistent order or simple mapping if header matches field name

        let successCount = 0;
        let failCount = 0;

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;

            // Simple CSV split (not robust for commas inside quotes, but lightweight)
            // For robust parsing, we'd need a library. Assuming simple "Save As CSV" from valid Excel.
            const values = lines[i].split(',');

            if (values.length < 2) { failCount++; continue; } // Need at least name/phone

            const leadData = {};
            headers.forEach((h, index) => {
                let val = values[index] ? values[index].trim() : '';
                // Remove quotes
                if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);

                if (['name', 'email', 'phone', 'source', 'campaign'].includes(h)) {
                    leadData[h] = val;
                }
            });

            if (!leadData.name || !leadData.phone) { failCount++; continue; }

            // Create Only if not exists (by email or phone)
            const exists = await Lead.findOne({
                where: {
                    [Op.or]: [
                        { email: leadData.email || 'invalid@email.com' },
                        { phone: leadData.phone }
                    ]
                }
            });

            if (!exists) {
                await Lead.create({
                    ...leadData,
                    unitId: [1, 10].includes(Number(req.user.roleId)) ? null : unitId, // Assign to current unit
                    status: 'new',
                    handledBy: 'AI'
                });
                successCount++;
            } else {
                failCount++;
            }
        }

        res.json({ message: 'Importação concluída', success: successCount, failed: failCount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- BULK IMPORT & UNDO ROUTES ---

// POST /api/crm/leads/import/check-duplicates - Check for existing leads
router.post('/leads/import/check-duplicates', auth, async (req, res) => {
    try {
        const { phones, unitId, externalIds } = req.body;
        if ((!phones || !Array.isArray(phones)) && (!externalIds || !Array.isArray(externalIds))) {
            return res.status(400).json({ error: 'Phones or External IDs array required' });
        }

        const requester = req.user;

        // Determine search unit
        let targetUnitId = unitId ? Number(unitId) : undefined;
        if (![ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(Number(requester.roleId))) {
            targetUnitId = requester.unitId; // Force safety
        }

        console.log('🔍 Checking Duplicates for Unit:', targetUnitId, '| Phones:', phones.length);

        // Normalize phones for search
        // Strategy: Search for both "raw clean" and "clean without 55" to catch format diffs
        const validPhones = phones.map(p => {
            const clean = String(p).replace(/\D/g, '');
            return clean;
        }).filter(p => p.length >= 8);

        const cleanExternalIds = (req.body.externalIds || []).filter(id => id);

        if (validPhones.length === 0 && cleanExternalIds.length === 0) {
            return res.json({ found: 0, duplicates: [] });
        }

        const variations = new Set();
        validPhones.forEach(p => {
            variations.add(p);
            // If starts with 55 and len > 11, try without 55
            if (p.startsWith('55') && p.length > 11) variations.add(p.substring(2));
            // If doesn't start with 55, try with 55
            if (!p.startsWith('55')) variations.add('55' + p);
        });

        const searchPhones = Array.from(variations);

        console.log(`🔎 Debug: Checking ${searchPhones.length} phone variations.`);
        if (searchPhones.length > 0) console.log(`🔎 Phone Sample: ${searchPhones.slice(0, 3)}...`);
        console.log(`🔎 Target Unit: ${targetUnitId || 'ALL'}`);



        // BUILD ROBUST SQL WHERE
        // We use literals to clean the phone column in SQLite/Sequelize
        const phoneColumnCleaned = sequelize.fn('replace',
            sequelize.fn('replace',
                sequelize.fn('replace',
                    sequelize.fn('replace',
                        sequelize.col('phone'),
                        ' ', ''),
                    '-', ''),
                '(', ''),
            ')', '');

        const orConditions = [];

        // Match Cleaned DB Phone against search variations
        if (searchPhones.length > 0) {
            orConditions.push(
                sequelize.where(phoneColumnCleaned, { [Op.in]: searchPhones })
            );
        }

        // Match by Importado ID (Absolute Truth & Legacy)
        if (cleanExternalIds.length > 0) {
            // New Schema Check
            orConditions.push({
                origin_id_importado: { [Op.in]: cleanExternalIds }
            });

            // Legacy Metadata Check
            cleanExternalIds.forEach(eid => {
                orConditions.push({
                    metadata: { [Op.like]: `%"externalId":${eid}%` }
                });
            });
        }

        if (orConditions.length === 0) return res.json({ found: 0, duplicates: [] });

        const where = {
            [Op.or]: orConditions
        };

        // Only verify valid unit IDs IF we are not searching by unique ID
        // If we are searching by Importado ID, we want to know GLOBAL duplicates to decide overwrite
        // But for phone, we might care about unit specific?
        // Actually, if "origin_id_importado" is unique global, we MUST check global.
        // So we apply unitId filter ONLY if we haven't matched by unique ID? 
        // No, 'where' is AND.
        // If we have unitId AND (phone OR id), we miss duplicates in usage.

        // CORRECTION: For unique IDs (Importado), we must Ignore Unit ID constraint.
        // For phone, arguably we should also check global to warn user?
        // Lead Import typically allows moving/overwriting.
        // Let's remove unit check for the lookup to find ALL conflicts.

        // if (targetUnitId) where.unitId = targetUnitId; // REMOVED to catch global duplicates

        const duplicates = await Lead.findAll({
            where,
            attributes: ['id', 'phone', 'name', 'unitId', 'metadata']
        });

        console.log(`✅ Duplicates Found: ${duplicates.length}`);
        if (duplicates.length > 0) console.log(`✅ Sample Duplicate: ${duplicates[0].phone} (ID: ${duplicates[0].id})`);

        res.json({
            found: duplicates.length,
            duplicates: duplicates.map(d => ({ id: d.id, phone: d.phone, name: d.name }))
        });
    } catch (error) {
        console.error('Check Duplicates Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/crm/leads/import/bulk - Execute Bulk Import
router.post('/leads/import/bulk', auth, async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { leads, duplicateAction, unitId, importId, ownerMap } = req.body; // duplicateAction: 'overwrite' | 'ignore'
        console.log('🔌 IMPORT DEBUG: Received Leads Count:', leads ? leads.length : 'NULL');
        const requester = req.user;

        // Security: Resolve finalUnitId for the batch
        let finalUnitId = unitId;
        const isGlobal = [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(Number(requester.roleId));
        if (!isGlobal) {
            finalUnitId = requester.unitId;
        }
        if (!finalUnitId) finalUnitId = 1; // Fallback

        let createdCount = 0;
        let updatedCount = 0;
        let ignoredCount = 0;
        const errors = [];

        // SMART IMPORT: Resolve User Names to IDs (Fallback Cache)
        const allUsers = await User.findAll({ attributes: ['id', 'name'] });
        const userMap = {};
        allUsers.forEach(u => {
            if (u.name) userMap[u.name.toLowerCase().trim()] = u.id;
        });

        if (!leads || !Array.isArray(leads)) {
            throw new Error('Lista de leads inválida ou vazia.');
        }

        for (let i = 0; i < leads.length; i++) {
            const leadData = leads[i];
            try {
                // 1. OWNER RECONCILIATION
                let consultantId = leadData.responsibleId || requester.id; // Priority 1: Row, Priority 2: Requester Fallback

                // Priority 3: OwnerMap (Text Match)
                if (!consultantId && ownerMap) {
                    const rName = String(leadData.responsible || '').trim();
                    if (rName && ownerMap[rName]) consultantId = ownerMap[rName];
                }

                // Priority 4: Fuzzy Match on Name
                if (!consultantId && leadData.responsible) {
                    const rNameLow = String(leadData.responsible).toLowerCase().trim();
                    if (userMap[rNameLow]) consultantId = userMap[rNameLow];
                    else {
                        const partial = Object.keys(userMap).find(k => k.includes(rNameLow) || rNameLow.includes(k));
                        if (partial) consultantId = userMap[partial];
                    }
                }

                // Fallback: Requester
                if (!consultantId) consultantId = requester.id;

                // 2. UNIT RECONCILIATION
                let finalUnitId = leadData.unitId || unitId;
                if (!finalUnitId) finalUnitId = requester.unitId;


                // 2. STRICT DEDUPLICATION
                let existing = null;
                const matchConditions = [];

                // Check by Importado ID (Absolute Truth - Global Check)
                if (leadData.origin_id_importado) {
                    existing = await Lead.findOne({
                        where: { origin_id_importado: leadData.origin_id_importado }, // Removed unitId scope to prevent global unique errors
                        transaction: t,
                        paranoid: false
                    });
                }

                if (!existing) {
                    // Check by Phone (Sanitized)
                    const cleanPhone = String(leadData.phone || '').replace(/\D/g, '');
                    if (cleanPhone.length > 8) {
                        const phoneCol = sequelize.fn('replace', sequelize.fn('replace', sequelize.fn('replace', sequelize.fn('replace', sequelize.col('phone'), ' ', ''), '-', ''), '(', ''), ')', '');
                        let phoneQuery;
                        if (cleanPhone.startsWith('55')) phoneQuery = sequelize.where(phoneCol, cleanPhone); // has 55
                        else phoneQuery = sequelize.where(phoneCol, { [Op.or]: [cleanPhone, '55' + cleanPhone] }); // missing 55 fallback

                        matchConditions.push(phoneQuery);
                    }
                }

                if (!existing && matchConditions.length > 0) {
                    existing = await Lead.findOne({
                        where: {
                            unitId: finalUnitId,
                            [Op.or]: matchConditions
                        },
                        transaction: t,
                        paranoid: false
                    });
                }

                // 3. DATA PREPARATION (Sanitization)
                // Filter strict keys to avoid pollution
                const validKeys = Object.keys(Lead.rawAttributes);
                const modelData = {};
                Object.keys(leadData).forEach(key => {
                    if (validKeys.includes(key) && key !== 'id') {
                        let val = leadData[key];
                        if (key === 'origin_id_importado' && (!val || String(val).trim() === '')) val = null;
                        modelData[key] = val;
                    }
                });

                modelData.consultant_id = consultantId;
                modelData.unitId = finalUnitId;
                // Ensure required defaults
                if (!modelData.name) modelData.name = 'Lead Importado';
                if (!modelData.phone) modelData.phone = '0000000000';

                // Sanitize tags
                if (modelData.tags && Array.isArray(modelData.tags)) {
                    modelData.tags = JSON.stringify(modelData.tags);
                }

                // Sanitize attempts (Fix String Violation)
                if (modelData.attempts && Array.isArray(modelData.attempts)) {
                    modelData.attempts = JSON.stringify(modelData.attempts);
                }

                if (leadData.createdAt) modelData.createdAt = leadData.createdAt;
                if (leadData.updatedAt) modelData.updatedAt = leadData.updatedAt;
                if (leadData.nextActionAt) modelData.nextActionAt = leadData.nextActionAt;
                if (leadData.lastScheduleDate) {
                    modelData.appointmentDate = leadData.lastScheduleDate;
                }

                // 4. PERSISTENCE
                let targetLeadId;
                let isNew = false;
                let currentLead = existing;
                if (existing) {
                    // RESURRECTION / CLEANUP LOGIC:
                    // Se o lead existe mas está na lixeira (deletedAt), o usuário NÃO quer restaurar os dados antigos/sujos.
                    // Ele quer criar um NOVO, limpo.
                    // Para evitar erro de "Duplicidade de Telefone/Email", precisamos APAGAR DEFINITIVAMENTE o antigo da lixeira.
                    if (existing.deletedAt) {
                        const Task = require('../models/Task');
                        // Limpa tasks órfãs
                        await Task.destroy({ where: { leadId: existing.id }, transaction: t });
                        // Hard Delete no Lead (Remove do banco para liberar o telefone)
                        await existing.destroy({ force: true, transaction: t });

                        existing = null; // Reseta variável para o código abaixo criar um lead novo do zero
                    }
                }

                if (existing) {
                    if (duplicateAction === 'overwrite') {
                        const mergedMeta = {
                            ...(typeof existing.metadata === 'string' ? JSON.parse(existing.metadata || '{}') : existing.metadata || {}),
                            ...(typeof leadData.metadata === 'string' ? JSON.parse(leadData.metadata || '{}') : leadData.metadata || {}),
                            lastUpdatedByImportId: importId
                        };

                        await existing.update({
                            ...modelData,
                            metadata: JSON.stringify(mergedMeta),
                            createdAt: leadData.createdAt || existing.createdAt
                        }, { transaction: t, silent: true });
                        updatedCount++;
                        targetLeadId = existing.id;
                        currentLead = existing;
                    } else {
                        ignoredCount++;
                        continue;
                    }
                } else {
                    const meta = {
                        ...(typeof leadData.metadata === 'string' ? JSON.parse(leadData.metadata || '{}') : leadData.metadata || {}),
                        createdByImportId: importId
                    };

                    currentLead = await Lead.create({
                        ...modelData,
                        metadata: JSON.stringify(meta),
                        createdAt: leadData.createdAt || new Date()
                    }, { transaction: t, silent: true });
                    createdCount++;
                    targetLeadId = currentLead.id;
                    isNew = true;
                }

                // 5. DEEP LOGGING (History & Cadence)

                // A. Structured Attempts (Matrix)
                if (leadData.contactAttempts && Array.isArray(leadData.contactAttempts)) {
                    for (const attempt of leadData.contactAttempts) {
                        if (attempt.type === 'cadence') {
                            // CadenceLog
                            await CadenceLog.create({
                                leadId: targetLeadId,
                                cadence_type: 'Negociação',
                                step_name: 'Importação',
                                content: attempt.notes,
                                date: attempt.date || new Date(),
                                unitId: finalUnitId
                            }, { transaction: t });
                        } else {
                            // ContactAttempt
                            await ContactAttempt.create({
                                leadId: targetLeadId,
                                attempt_number: attempt.attemptNumber || 1,
                                result: String(attempt.notes || '').substring(0, 255),
                                type: 'Tentativa',
                                timestamp: attempt.date
                            }, { transaction: t });
                        }
                    }
                }

                // B. Legacy Text History (If mapped explicitly)
                if (leadData.metadata && leadData.metadata.importHistory) {
                    const history = leadData.metadata.importHistory;
                    if (Array.isArray(history)) {
                        const logsToSave = [];

                        // Just append to generic JSON history
                        let currentHistory = [];
                        try { currentHistory = JSON.parse(currentLead.history || '[]'); } catch (e) { }
                        const newHistory = history.map(h => ({
                            date: leadData.createdAt || new Date().toISOString(),
                            actor: 'Import',
                            action: 'log',
                            content: h
                        }));
                        await currentLead.update({ history: JSON.stringify([...newHistory, ...currentHistory].slice(0, 200)) }, { transaction: t });
                    }
                }

                await generateSmartTask(targetLeadId, modelData.status, leadData, finalUnitId, consultantId, t);

                // C. Auto Enrollment Task for Won Leads via Import
                if (modelData.status === 'won') {
                    await createEnrollmentTask(currentLead, requester, t);
                }

            } catch (err) {
                // Log but proceed
                let errorMessage = err.message;
                // Specific Sequelize Validation details
                if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
                    const validationErrors = err.errors.map(e => `${e.path} (${e.message})`).join(', ');
                    errorMessage = `${err.name}: ${validationErrors}`;
                    console.error(`Import Validation Error Row ${i} (${leadData.name}): `, JSON.stringify(err.errors, null, 2));
                } else {
                    console.error(`Import Error Row ${i} (${leadData.name}):`, err.message);
                }

                errors.push(`Row ${i + 1} (${leadData.name}): ${errorMessage}`);
                ignoredCount++;
            }
        }

        await t.commit();
        res.json({ success: true, created: createdCount, updated: updatedCount, ignored: ignoredCount, errors, importId });

    } catch (error) {
        if (t) await t.rollback();
        console.error('Erro Global na Importação em Massa:', error.message);
        res.status(500).json({ error: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
    }
});

async function generateSmartTask(leadId, status, leadData, unitId, assignedUserId, transaction) {
    if (['archived', 'closed', 'lost', 'closed_lost', 'won'].includes(status)) return;
    const mapping = {
        'new': { title: 'Primeiro Contato (Importação)', category: 'commercial' },
        'connecting': { title: 'Nova Tentativa', category: 'commercial' },
        'connected': { title: 'Retomar Contato', category: 'commercial' },
        'scheduled': { title: 'Agendamento', category: 'commercial' },
        'no_show': { title: 'Retomar Contato', category: 'commercial' },
        'negotiation': { title: 'Negociar', category: 'commercial' },
        'nurturing': { title: 'Nutrição', category: 'commercial' }
    };
    const config = mapping[status] || { title: 'Tarefa de Importação', category: 'commercial' };

    let finalAssigneeId = assignedUserId;
    if (status === 'won') {
        const adminUser = await User.findOne({
            where: {
                unitId: unitId,
                roleId: { [Op.in]: [ROLE_IDS.FRANCHISEE, ROLE_IDS.MANAGER, ROLE_IDS.ADMIN_FINANCIAL] }
            },
            transaction
        });
        if (adminUser) finalAssigneeId = adminUser.id;
    }

    let taskDate = leadData.nextTaskDate;
    if (!taskDate) taskDate = new Date();

    const existingTask = await Task.findOne({
        where: {
            leadId: leadId,
            title: config.title
        },
        transaction
    });

    if (existingTask) {
        // Close OTHER pending tasks first to ensure exclusivity
        await Task.update({ status: 'done' }, {
            where: {
                leadId: leadId,
                status: 'pending',
                id: { [Op.ne]: existingTask.id }
            },
            transaction
        });

        // Always update the task with new data from import
        await existingTask.update({
            status: 'pending',
            dueDate: taskDate,
            userId: finalAssigneeId,
            description: String(leadData.observation || leadData.notes || existingTask.description)
        }, { transaction });

        return;
    }

    // New Task: Close all other pending tasks for this lead first
    await Task.update({ status: 'done' }, {
        where: { leadId: leadId, status: 'pending' },
        transaction
    });

    await Task.create({
        title: config.title,
        description: String(leadData.observation || leadData.notes || `Iniciada via importação. Estágio: ${status}.`),
        dueDate: taskDate,
        status: 'pending',
        priority: 'high',
        category: config.category,
        leadId: leadId,
        userId: finalAssigneeId,
        unitId: unitId
    }, { transaction });
}

// POST alias for undo import (frontend compatibility)
router.post('/leads/import/undo/:importId', auth, async (req, res) => {
    try {
        const { importId } = req.params;
        const requester = req.user;

        if (!importId) return res.status(400).json({ error: 'Import ID required' });

        const allLeads = await Lead.findAll({
            attributes: ['id', 'metadata', 'unitId']
        });

        const idsToDelete = allLeads.filter(l => {
            if (![ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(Number(requester.roleId)) && l.unitId !== requester.unitId) return false;

            const meta = typeof l.metadata === 'string' ? JSON.parse(l.metadata || '{}') : (l.metadata || {});
            return meta.createdByImportId === importId;
        }).map(l => l.id);

        if (idsToDelete.length > 0) {
            const Task = require('../models/Task');
            await Task.destroy({ where: { leadId: { [Op.in]: idsToDelete } } });
            await Lead.destroy({ where: { id: { [Op.in]: idsToDelete } } });
        }

        res.json({ success: true, deleted: idsToDelete.length });

    } catch (error) {
        console.error('Undo Import Error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/leads/import/:importId', auth, async (req, res) => {
    try {
        const { importId } = req.params;
        const requester = req.user;

        if (!importId) return res.status(400).json({ error: 'Import ID required' });

        // Security Scope
        const whereScope = {};
        // If not global, strict check? 
        // We delete by importId, which is unique enough. 
        // But let's ensure we don't delete cross-unit if user is franchisee (though duplicate IDs unlikely)

        // Find leads created by this import
        // Sequelize JSON query for sqlite/postgres vary. 
        // For SQLite/Generic, we might need a clearer way or search all.
        // Let's use string like match for simple JSON text if JSON operations aren't standard across all DBs used here.
        // Or fetch all and filter in memory if batch is small.
        // Better: Use Op.like on metadata text column if it's text.

        // Metadata is defined as JSON type in Postgres, TEXT in Sqlite usually.
        // Use generic safe approach:

        // Actually, let's assume standard destruction.
        // We can't easily query JSON in generic Sequelize without dialect specifics.
        // WORKAROUND: Tag leads with a standard column 'source' = 'Import: <ID>'? 
        // No, 'source' is user facing.

        // Use a loop: Find all leads in unit, check metadata.
        const allLeads = await Lead.findAll({
            attributes: ['id', 'metadata', 'unitId']
        });

        const idsToDelete = allLeads.filter(l => {
            // Security
            if (![ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(Number(requester.roleId)) && l.unitId !== requester.unitId) return false;

            const meta = typeof l.metadata === 'string' ? JSON.parse(l.metadata || '{}') : (l.metadata || {});
            return meta.createdByImportId === importId;
        }).map(l => l.id);

        if (idsToDelete.length > 0) {
            // Delete Tasks first
            const Task = require('../models/Task');
            await Task.destroy({ where: { leadId: { [Op.in]: idsToDelete } } });
            await Lead.destroy({ where: { id: { [Op.in]: idsToDelete } } });
        }

        res.json({ success: true, deleted: idsToDelete.length });

    } catch (error) {
        console.error('Undo Import Error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/import/mapping', auth, async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '../../custom_mapping.json');
        if (!fs.existsSync(filePath)) return res.json({ mapping: null });
        const data = fs.readFileSync(filePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Get Mapping Error:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/import/save-mapping', auth, async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const mapping = req.body;
        const filePath = path.join(__dirname, '../../custom_mapping.json');
        fs.writeFileSync(filePath, JSON.stringify(mapping, null, 2));
        res.json({ success: true });
    } catch (error) {
        console.error('Save Mapping Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/crm/leads/:id/convert-to-student
// Convert a won lead to a student with enrollment
router.post('/leads/:id/convert-to-student', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { courseId, classId, registrationNumber } = req.body;

        // Fetch lead
        const lead = await Lead.findByPk(id);
        if (!lead) {
            return res.status(404).json({ error: 'Lead não encontrado' });
        }

        // Verify lead is in won status
        if (lead.status !== 'won') {
            return res.status(400).json({ error: 'Lead deve estar em status "Matricular" para conversão' });
        }

        // Check if already converted
        const Student = require('../models/Student');
        const existingStudent = await Student.findOne({ where: { leadId: id } });
        if (existingStudent) {
            return res.status(400).json({ error: 'Lead já foi convertido em aluno', studentId: existingStudent.id });
        }

        // Fetch class to verify capacity
        const Class = require('../models/Class');
        const classData = await Class.findByPk(classId);
        if (!classData) {
            return res.status(404).json({ error: 'Turma não encontrada' });
        }

        // Count current students in class
        const currentStudents = await Student.count({ where: { classId } });
        if (currentStudents >= classData.capacity) {
            return res.status(400).json({ error: 'Turma está com capacidade máxima', capacity: classData.capacity, current: currentStudents });
        }

        // Create student from lead data
        const student = await Student.create({
            leadId: id,
            unitId: lead.unitId,
            userId: lead.consultant_id || req.user.id,
            name: lead.name,
            email: lead.email,
            mobile: lead.phone1 || lead.phone2,
            phone: lead.phone2,
            cpf: lead.cpf,
            cep: lead.cep,
            address: lead.address,
            neighborhood: lead.neighborhood,
            city: lead.city,
            classId,
            courseId,
            registrationNumber: registrationNumber || null,
            status: 'active',
            contractStatus: 'pending',
            paymentStatus: 'pending'
        });

        // Update lead to mark as converted
        await lead.update({
            status: 'won',
            metadata: {
                ...(lead.metadata || {}),
                convertedToStudent: true,
                studentId: student.id,
                conversionDate: new Date().toISOString()
            }
        });

        // Log activity
        const history = lead.history || [];
        history.push({
            date: new Date().toISOString(),
            action: 'converted_to_student',
            user: req.user.name,
            details: `Convertido em aluno #${student.id} - Turma: ${classData.name}`
        });
        await lead.update({ history });

        res.json({
            success: true,
            student,
            lead,
            message: 'Lead convertido em aluno com sucesso'
        });
    } catch (error) {
        console.error('Convert Lead to Student Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
