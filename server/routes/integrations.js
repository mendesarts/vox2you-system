const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Task = require('../models/Task');
const Unit = require('../models/Unit');
const User = require('../models/User');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

/**
 * WEBHOOK VERIFICATION (META ADS)
 * GET /api/integrations/leads/webhook
 */
router.get('/leads/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const SYSTEM_TOKEN = process.env.INTEGRATION_TOKEN || 'vox-secret-2026';

    if (mode === 'subscribe' && token === SYSTEM_TOKEN) {
        console.log('WEBHOOK_VERIFIED (META)');
        return res.status(200).send(challenge);
    } else {
        return res.status(403).end();
    }
});

/**
 * WEBHOOK RECEIVER: /api/integrations/leads/webhook
 * Supports: Zapier/Make (Standard), Google Ads (Native), Meta Ads (Native)
 */
router.post('/leads/webhook', async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const headerToken = req.headers['x-crm-token'];
        const bodyToken = req.body.google_key; // Google Ads sends key in body
        const SYSTEM_TOKEN = process.env.INTEGRATION_TOKEN || 'vox-secret-2026';

        // Security Check
        if (headerToken !== SYSTEM_TOKEN && bodyToken !== SYSTEM_TOKEN) {
            await transaction.rollback();
            return res.status(401).json({ error: 'Unauthorized: Invalid Token' });
        }

        let leadData = { ...req.body };

        // 1. ADAPTER: GOOGLE ADS (Native)
        if (req.body.user_column_data) {
            console.log('Adapting Google Ads native payload');
            const cols = req.body.user_column_data;
            const getValue = (key) => cols.find(c => c.column_id === key)?.string_value;

            leadData = {
                name: getValue('FULL_NAME'),
                phone: getValue('USER_PHONE'),
                email: getValue('USER_EMAIL'),
                source: 'Google Ads (Nativo)',
                utm_source: 'google',
                utm_medium: 'cpc',
                campaign: req.body.campaign_id,
                unitId: req.query.unitId,
                adData: {
                    source: 'google',
                    campaignId: req.body.campaign_id,
                    adGroupId: req.body.adgroup_id,
                    adId: req.body.creative_id,
                    gclid: getValue('GCLID') || req.body.gclid || null
                }
            };
        }

        // 2. ADAPTER: META ADS (Native Payload Detection)
        if (req.body.object === 'page' && req.body.entry) {
            console.log('Recebido evento do Meta Ads (Leadgen ID)');
            const entry = req.body.entry[0];
            const change = entry.changes[0].value;

            leadData = {
                name: `Lead Meta - ID ${change.leadgen_id}`,
                phone: '00000000000', // Placeholder
                source: 'Meta Ads (Nativo)',
                adData: {
                    source: 'facebook',
                    adId: change.leadgen_id,
                    campaignId: change.campaign_id,
                    adGroupId: change.adgroup_id
                }
            };
        }

        const name = leadData.name || leadData.fullname;
        const rawPhone = leadData.phone || leadData.whatsapp;

        if (!name || !rawPhone) {
            await transaction.rollback();
            return res.status(400).json({ error: 'Missing name or phone in adapted payload' });
        }

        // Clean Phone
        const phone = String(rawPhone).replace(/\D/g, '');

        // Duplicate Check (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const existingLead = await Lead.findOne({
            where: {
                phone,
                createdAt: { [Op.gt]: thirtyDaysAgo }
            },
            transaction
        });

        if (existingLead) {
            await transaction.rollback();
            return res.json({ success: true, message: 'Duplicate found', id: existingLead.id });
        }

        // Determine Unit
        let unitId = Number(leadData.unitId || req.query.unitId);
        if (!unitId) {
            const firstUnit = await Unit.findOne({ order: [['id', 'ASC']], transaction });
            unitId = firstUnit ? firstUnit.id : 1;
        }

        // Create Lead
        const newLead = await Lead.create({
            name: name.trim(),
            phone,
            email: leadData.email || null,
            source: leadData.source || 'Ads',
            utm_source: leadData.utm_source || 'webhook',
            utm_medium: leadData.utm_medium || 'cpc',
            utm_campaign: leadData.utm_campaign || leadData.campaign || null,
            funnel: 'crm',
            status: 'new',
            unitId,
            notes: leadData.notes || `Lead recebido via Integração Nativa (${leadData.source || 'Ads'})`,
            metadata: JSON.stringify(req.body),
            adData: leadData.adData || {}
        }, { transaction });

        // Auto-Generate First Task
        await Task.create({
            title: `📞 Primeiro Contato: ${newLead.name}`,
            description: `Lead automático via ${newLead.source}. Abordar imediatamente.`,
            leadId: newLead.id,
            unitId: newLead.unitId,
            dueDate: new Date(),
            status: 'pending',
            type: 'Primeiro Contato'
        }, { transaction });

        await transaction.commit();
        res.status(201).json({ success: true, leadId: newLead.id });

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error('Integration Webhook Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
