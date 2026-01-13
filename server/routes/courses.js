const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Module = require('../models/Module');

const auth = require('../middleware/auth');
const { ROLE_IDS } = require('../config/roles');

// Middleware for Global Admin Check
const checkGlobalAccess = (req, res, next) => {
    if ([ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(req.user.roleId)) {
        next();
    } else {
        res.status(403).json({ error: 'Acesso restrito a Contas Globais.' });
    }
};

// GET /courses - Include modules (Access: All Users)
router.get('/', auth, async (req, res) => {
    try {
        const courses = await Course.findAll({
            include: [{ model: Module, as: 'Modules' }],
            order: [
                ['name', 'ASC'],
                [{ model: Module, as: 'Modules' }, 'order', 'ASC']
            ]
        });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /courses/:id (Access: All Users)
router.get('/:id', auth, async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id, {
            include: [{ model: Module, as: 'Modules' }],
            order: [[{ model: Module, as: 'Modules' }, 'order', 'ASC']]
        });
        if (!course) return res.status(404).json({ error: 'Curso não encontrado' });
        res.json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /courses - Create Course (Global Only)
router.post('/', auth, checkGlobalAccess, async (req, res) => {
    try {
        // Ensure numeric fields are stored as numbers
        const { name, workload, weeklyFrequency, mentorshipsIncluded } = req.body;
        const parsedWorkload = parseInt(workload, 10);
        const parsedFrequency = weeklyFrequency ? parseInt(weeklyFrequency, 10) : 2; // Default to 2 if missing
        const parsedMentorships = mentorshipsIncluded ? parseInt(mentorshipsIncluded, 10) : 0;

        const course = await Course.create({
            name,
            workload: parsedWorkload,
            weeklyFrequency: parsedFrequency,
            mentorshipsIncluded: parsedMentorships,
            category: 'Oratória'
        });
        res.status(201).json(course);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// POST /courses/:id/modules - Add Module (Global Only)
router.post('/:id/modules', auth, checkGlobalAccess, async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) return res.status(404).json({ error: 'Curso não encontrado' });
        const module = await Module.create({
            ...req.body,
            courseId: req.params.id
        });
        res.status(201).json(module);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT /courses/modules/:id - Update Module (Global Only)
router.put('/modules/:id', auth, checkGlobalAccess, async (req, res) => {
    try {
        const module = await Module.findByPk(req.params.id);
        if (!module) return res.status(404).json({ error: 'Módulo não encontrado' });
        await module.update(req.body);
        res.json(module);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE /courses/modules/:id - Delete Module (Global Only)
router.delete('/modules/:id', auth, checkGlobalAccess, async (req, res) => {
    try {
        const module = await Module.findByPk(req.params.id);
        if (!module) return res.status(404).json({ error: 'Módulo não encontrado' });
        await module.destroy();
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

// PUT /courses/:id - Update Course (Global Only)
router.put('/:id', auth, checkGlobalAccess, async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) return res.status(404).json({ error: 'Curso não encontrado' });

        const { name, workload, weeklyFrequency } = req.body;
        const updateData = { name, workload };

        if (weeklyFrequency !== undefined) {
            updateData.weeklyFrequency = parseInt(weeklyFrequency, 10);
        }

        await course.update(updateData);
        res.json(course);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE /courses/:id - Delete Course (Global Only)
router.delete('/:id', auth, checkGlobalAccess, async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) return res.status(404).json({ error: 'Curso não encontrado' });
        await course.destroy();
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// POST /courses/:id/launch - Launch program (Global Only)
router.post('/:id/launch', auth, checkGlobalAccess, async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) return res.status(404).json({ error: 'Curso não encontrado' });
        res.json({ message: 'Programa de aulas lançado para o curso', courseId: course.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;
