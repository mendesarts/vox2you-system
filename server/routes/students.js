const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Class = require('../models/Class');
const Course = require('../models/Course');
const { Op } = require('sequelize');

// GET /students - Listar com filtros
router.get('/', async (req, res) => {
    try {
        const { search, classId } = req.query;
        let where = {};

        if (search) {
            where.name = { [Op.like]: `%${search}%` };
        }
        if (classId) {
            where.classId = classId;
        }

        const students = await Student.findAll({
            where,
            include: [
                { model: Class },
                { model: Course }
            ]
        });
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /students - Criar aluno
router.post('/', async (req, res) => {
    try {
        // Validação básica de duplicidade
        if (req.body.cpf) {
            const exists = await Student.findOne({ where: { cpf: req.body.cpf } });
            if (exists) return res.status(400).json({ error: 'CPF já cadastrado.' });
        }

        const student = await Student.create(req.body);
        res.status(201).json(student);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT /students/:id - Atualizar
router.put('/:id', async (req, res) => {
    try {
        const student = await Student.findByPk(req.params.id);
        if (!student) return res.status(404).json({ error: 'Aluno não encontrado' });

        await student.update(req.body);
        res.json(student);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
