const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');

// GET all leads (Filtered by Role)
router.get('/', auth, async (req, res) => {
    try {
        const userRole = req.user.role;
        const userId = req.user.id;

        let queryOptions = {};

        // Se for consultor, só vê os seus ou sem dono
        if (userRole === 'consultant') {
            queryOptions.where = {
                [Op.or]: [
                    { ownerId: userId },
                    { ownerId: null } // Opcional: ver leads livres para pegar
                ]
            };
        }
        // Admin, Sales Leader veem tudo

        const leads = await Lead.findAll(queryOptions);
        res.json(leads);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Lead (Auto-assign creator)
router.post('/', auth, async (req, res) => {
    try {
        const { name, phone, interest } = req.body;
        const newLead = await Lead.create({
            name,
            phone,
            interest,
            ownerId: req.user.id // Auto-atribui para quem criou
        });
        res.status(201).json(newLead);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Atualizar estágio do lead (Arrastar no Kanban)
router.put('/:id/stage', async (req, res) => {
    try {
        const { id } = req.params;
        const { stage } = req.body;

        await Lead.update({ stage }, { where: { id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
