const express = require('express');
const router = express.Router();
const AIConfig = require('../models/AIConfig');

// GET /api/ai-config
router.get('/', async (req, res) => {
    try {
        let config = await AIConfig.findOne();
        if (!config) {
            config = await AIConfig.create({});
        }
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/ai-config
router.put('/', async (req, res) => {
    try {
        const { systemPrompt, advisorPrompt, knowledgeBase } = req.body;
        let config = await AIConfig.findOne();
        if (!config) {
            config = await AIConfig.create({ systemPrompt, advisorPrompt, knowledgeBase: JSON.stringify(knowledgeBase) });
        } else {
            await config.update({
                systemPrompt,
                advisorPrompt,
                knowledgeBase: JSON.stringify(knowledgeBase)
            });
        }
        res.json(config);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
