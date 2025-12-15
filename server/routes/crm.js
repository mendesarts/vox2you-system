const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const User = require('../models/User'); // Import User
const auth = require('../middleware/auth'); // Import Auth
const { Op } = require('sequelize');

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
        if (role !== 'master') {
            where.unitId = unitId;
        }

        // Fetch leads
        const leads = await Lead.findAll({
            where,
            attributes: ['consultantId']
        });

        if (leads.length === 0) return res.json(null); // No sales

        // Count sales
        const counts = {};
        leads.forEach(l => {
            if (l.consultantId) {
                counts[l.consultantId] = (counts[l.consultantId] || 0) + 1;
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

    await lead.update({
        history: JSON.stringify(history),
        lastContactAt: now,
        attemptCount: lead.attemptCount + 1,
        // Schedule next attempt in 12 hours (simplified cadence)
        nextActionAt: new Date(now.getTime() + 12 * 60 * 60 * 1000)
    });

    return message;
};

// GET /api/crm/leads - List all leads
router.get('/leads', async (req, res) => {
    try {
        const leads = await Lead.findAll({ order: [['updatedAt', 'DESC']] });
        res.json(leads);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/crm/leads - Create new Lead (Manual or Webhook)
router.post('/leads', async (req, res) => {
    try {
        const { name, phone, email, source, campaign } = req.body;
        const lead = await Lead.create({
            name, phone, email, source, campaign,
            status: 'new',
            handledBy: 'AI'
        });

        // Trigger AI Welcome
        await executeAIAction(lead, 'welcome');

        res.status(201).json(lead);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/crm/leads/:id/move - Move card in Kanban
router.put('/leads/:id/move', async (req, res) => {
    try {
        const { status } = req.body;
        const lead = await Lead.findByPk(req.params.id);

        if (!lead) return res.status(404).json({ error: 'Lead not found' });

        const oldStatus = lead.status;

        let updates = { status };

        // Logic: Switch AI/Human based on column
        if (['new', 'qualifying_ia', 'no_show'].includes(status)) {
            updates.handledBy = 'AI';
        } else if (['scheduled', 'negotiation', 'won'].includes(status)) {
            updates.handledBy = 'HUMAN';
        }

        // Logic: Reset attempts if moving to No-Show to start reactivation cadence
        if (status === 'no_show' && oldStatus !== 'no_show') {
            updates.attemptCount = 0;
            // Immediate Trigger
            await executeAIAction(lead, 'reactivation');
        }

        await lead.update(updates);
        res.json(lead);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/crm/cadence/run - Run Cron Job for AI (Simulated)
router.post('/cadence/run', async (req, res) => {
    try {
        const now = new Date();

        // Find leads handled by AI that are due for contact
        // Rules: active AI, not lost, nextActionAt is passed or null (new), attemptCount < 5
        const leads = await Lead.findAll({
            where: {
                handledBy: 'AI',
                status: { [Op.notIn]: ['won', 'lost', 'scheduled'] },
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
                status: { [Op.notIn]: ['won', 'lost'] },
                attemptCount: { [Op.gte]: 5 }
            }
        });

        for (const lead of expiredLeads) {
            await lead.update({ status: 'lost', notes: 'Encerrado automaticamente pela IA após 5 tentativas sem resposta.' });
        }

        res.json({ message: 'Cadence ran', processed, expired: expiredLeads.length });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/crm/leads/:id/takeover - Human takes over AI
router.post('/leads/:id/takeover', async (req, res) => {
    try {
        const lead = await Lead.findByPk(req.params.id);
        if (!lead) return res.status(404).json({ error: 'Lead not found' });

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
router.post('/leads/:id/interaction', async (req, res) => {
    try {
        const { type, content } = req.body; // type: 'call', 'whatsapp', 'email'
        const lead = await Lead.findByPk(req.params.id);

        if (!lead) return res.status(404).json({ error: 'Lead not found' });

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

        // AUTOMATION: If Lead is NEW and we interacted, move to Qualifying
        if (lead.status === 'new') {
            updates.status = 'qualifying_ia';
            updates.handledBy = 'HUMAN'; // Assuming human logged the interaction usually
        }

        // AUTOMATION: If Lead was No-Show and we contacted, maybe move to Qualifying or keep No-Show until rescheduled?
        // User requested: "se consegui contato... mas nao agendei... passar para aba qualificacao"
        // This implies if we establish contact, we are now "Qualifying/Negotiating".
        if (lead.status === 'no_show') {
            updates.status = 'qualifying_ia';
        }

        await lead.update(updates);
        res.json(lead);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
