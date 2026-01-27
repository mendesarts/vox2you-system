const express = require('express');
const router = express.Router();
const { Message, Lead } = require('../models');
const { Op } = require('sequelize');

// 1. OUTBOX: Robô busca mensagens que precisa enviar
router.get('/outbox', async (req, res) => {
    try {
        const pendingMessages = await Message.findAll({
            where: { status: 'PENDING_SEND' },
            include: [{ model: Lead, attributes: ['phone'] }], // Precisa do telefone para enviar
            limit: 50 // Processa em lotes para não travar
        });
        res.json(pendingMessages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. CONFIRM: Robô avisa que enviou com sucesso
router.post('/confirm-send', async (req, res) => {
    const { ids } = req.body; // Array de IDs
    try {
        await Message.update(
            { status: 'SENT' },
            { where: { id: { [Op.in]: ids } } }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. INBOX: Robô envia mensagem recebida do cliente (Webhook)
router.post('/incoming', async (req, res) => {
    const { phone, content, type } = req.body;
    try {
        // Tenta encontrar o lead pelo telefone exato
        let lead = await Lead.findOne({ where: { phone: phone } });

        // Fallback: Tentar formatos comuns se não achar exato (ex: com ou sem 55)
        if (!lead) {
            // Se veio 55... tenta sem
            if (phone.startsWith('55')) {
                lead = await Lead.findOne({ where: { phone: phone.substring(2) } });
            } else {
                // Se veio sem... tenta com 55
                lead = await Lead.findOne({ where: { phone: '55' + phone } });
            }
        }

        // Se não achar o lead, retorna 404 (Regra: Só aceita msg de Lead existente)
        if (!lead) {
            // Opcional: Logar tentativas orfãs
            console.log(`[SYNC INCOMING] Mensagem orfã de ${phone}: ${content}`);
            return res.status(404).json({ message: 'Lead não encontrado, ignorando.' });
        }

        await Message.create({
            leadId: lead.id,
            content,
            direction: 'IN',
            status: 'READ', // Já chega lida pois caiu no sistema
            type: type || 'text'
        });

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
