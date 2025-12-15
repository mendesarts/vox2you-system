const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Module = require('../models/Module');

// GET /courses - Include modules
router.get('/', async (req, res) => {
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

// POST /courses - Create Course (category fixed to Oratória)
router.post('/', async (req, res) => {
    try {
        // Ensure numeric fields are stored as numbers
        const { name, workload, weeklyFrequency } = req.body;
        const parsedWorkload = parseInt(workload, 10);
        const parsedFrequency = weeklyFrequency ? parseInt(weeklyFrequency, 10) : 2; // Default to 2 if missing

        const course = await Course.create({
            name,
            workload: parsedWorkload,
            weeklyFrequency: parsedFrequency,
            category: 'Oratória'
        });
        res.status(201).json(course);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});


// POST /courses/:id/modules - Add Module (lesson) to Course
router.post('/:id/modules', async (req, res) => {
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

// PUT /courses/modules/:id - Update Module
router.put('/modules/:id', async (req, res) => {
    try {
        const module = await Module.findByPk(req.params.id);
        if (!module) return res.status(404).json({ error: 'Módulo não encontrado' });
        await module.update(req.body);
        res.json(module);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE /courses/modules/:id - Delete Module
router.delete('/modules/:id', async (req, res) => {
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

// PUT /courses/:id - Update Course (cannot change category)
router.put('/:id', async (req, res) => {
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

// DELETE /courses/:id - Delete Course with confirmation handled on client side
router.delete('/:id', async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) return res.status(404).json({ error: 'Curso não encontrado' });
        await course.destroy();
        res.status(204).send();
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// POST /courses/:id/launch - Launch program of classes (placeholder)
router.post('/:id/launch', async (req, res) => {
    try {
        // Placeholder logic: just acknowledge launch
        const course = await Course.findByPk(req.params.id);
        if (!course) return res.status(404).json({ error: 'Curso não encontrado' });
        // In real implementation, would trigger program generation
        res.json({ message: 'Programa de aulas lançado para o curso', courseId: course.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;
