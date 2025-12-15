const express = require('express');
const router = express.Router();
const Unit = require('../models/Unit');

// Listar todas as unidades (Public for authenticated users)
router.get('/', async (req, res) => {
    try {
        const units = await Unit.findAll({ where: { active: true } });
        res.json(units);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
