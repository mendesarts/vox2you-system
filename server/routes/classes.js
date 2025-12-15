const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const Course = require('../models/Course');
const Professor = require('../models/Professor');
const User = require('../models/User');
const Student = require('../models/Student');
const Module = require('../models/Module');
const Holiday = require('../models/Holiday');
const ClassSession = require('../models/ClassSession');
const { Op } = require('sequelize');

// GET /classes (turmas)
router.get('/', async (req, res) => {
    try {
        const classes = await Class.findAll({
            include: [
                { model: Course },
                { model: User, as: 'professor' },
                { model: Student }
            ]
        });
        res.json(classes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /classes/:id/students
router.get('/:id/students', async (req, res) => {
    try {
        const students = await Student.findAll({
            where: { classId: req.params.id }
        });
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /classes
router.post('/', async (req, res) => {
    try {
        console.log('POST /classes payload:', req.body);
        const newClass = await Class.create(req.body);
        res.status(201).json(newClass);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT /classes/:id
router.put('/:id', async (req, res) => {
    try {
        const classObj = await Class.findByPk(req.params.id);
        if (!classObj) return res.status(404).json({ error: 'Turma não encontrada' });

        await classObj.update(req.body);
        res.json(classObj);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE /classes/:id
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Class.destroy({
            where: { id: req.params.id }
        });
        if (deleted) {
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Turma não encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /classes/:id/generate-schedule
router.post('/:id/generate-schedule', async (req, res) => {
    try {
        const classObj = await Class.findByPk(req.params.id, {
            include: [{ model: Course, include: [{ model: Module }] }]
        });

        if (!classObj) return res.status(404).json({ error: 'Turma não encontrada' });
        if (!classObj.Course) return res.status(400).json({ error: 'Turma sem curso associado' });
        if (!classObj.Course.Modules || classObj.Course.Modules.length === 0) {
            return res.status(400).json({ error: 'Curso sem módulos cadastrados' });
        }

        // Parse Days (Stored as JSON string e.g., '["Seg", "Qua"]')
        let targetDays = [];
        try {
            const daysNames = JSON.parse(classObj.days);
            const dayMap = { 'Dom': 0, 'Seg': 1, 'Ter': 2, 'Qua': 3, 'Qui': 4, 'Sex': 5, 'Sab': 6 };
            targetDays = daysNames.map(d => dayMap[d]).filter(d => d !== undefined);
        } catch (e) {
            return res.status(400).json({ error: 'Erro ao processar dias da semana. Formato inválido.' });
        }

        if (targetDays.length === 0) return res.status(400).json({ error: 'Nenhum dia de aula válido selecionado.' });

        const timeStr = classObj.startTime; // "19:00:00"

        // Fetch Holidays
        const holidays = await Holiday.findAll();
        const holidayDates = new Set(holidays.map(h => h.startDate)); // Simplified: handling single dates for now, ranges need expansion
        // Actually, let's expand ranges
        const blockedDates = new Set();
        holidays.forEach(h => {
            let current = new Date(h.startDate);
            const end = new Date(h.endDate);
            while (current <= end) {
                blockedDates.add(current.toISOString().split('T')[0]);
                current.setDate(current.getDate() + 1);
            }
        });

        // Delete existing future sessions for this class to avoid duplicates if re-generating
        await ClassSession.destroy({
            where: {
                classId: classObj.id,
                status: 'scheduled'
            }
        });

        const sortedModules = classObj.Course.Modules.sort((a, b) => a.order - b.order);
        const sessionsToCreate = [];

        // Start date
        let currentDate = new Date(classObj.startDate);
        // Adjust current date to be at least today or start date? 
        // For now, respect startDate rigorously.

        // Loop through modules
        for (const mod of sortedModules) {
            let scheduled = false;
            while (!scheduled) {
                const dayOfWeek = currentDate.getDay();

                // Construct Local Date String YYYY-MM-DD
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const day = String(currentDate.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;

                if (targetDays.includes(dayOfWeek) && !blockedDates.has(dateStr)) {
                    sessionsToCreate.push({
                        classId: classObj.id,
                        moduleId: mod.id,
                        date: dateStr,
                        startTime: timeStr,
                        status: 'scheduled'
                    });
                    scheduled = true;
                }
                // Move to next day
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        await ClassSession.bulkCreate(sessionsToCreate);

        // Update Class endDate based on the last session
        if (sessionsToCreate.length > 0) {
            const lastSession = sessionsToCreate[sessionsToCreate.length - 1];
            await classObj.update({ endDate: lastSession.date });
        }

        res.json({
            message: 'Cronograma gerado com sucesso',
            count: sessionsToCreate.length,
            endDate: classObj.endDate
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
