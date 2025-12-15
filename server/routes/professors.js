const express = require('express');
const router = express.Router();
const Professor = require('../models/Professor');

// GET /professors
router.get('/', async (req, res) => {
    try {
        const professors = await Professor.findAll();
        res.json(professors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /professors
router.post('/', async (req, res) => {
    try {
        const professor = await Professor.create(req.body);
        res.status(201).json(professor);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
