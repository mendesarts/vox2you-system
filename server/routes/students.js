const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Class = require('../models/Class');
const Course = require('../models/Course');
const { Op } = require('sequelize');
const { checkUnitIsolation } = require('../utils/unitIsolation');

const auth = require('../middleware/auth');

// GET /students - Listar com filtros
router.get('/', auth, async (req, res) => {
    try {
        const { search, classId } = req.query;
        const { unitId, role, roleId } = req.user;
        let where = {};

        // Security Filter
        const isGlobal = [1, 10].includes(Number(roleId));
        if (!isGlobal && unitId) {
            where.unitId = unitId;
        }

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
router.post('/', auth, async (req, res) => {
    try {
        const { unitId, id: userId, role } = req.user;

        // Validação básica de duplicidade
        if (req.body.cpf) {
            const exists = await Student.findOne({ where: { cpf: req.body.cpf } });
            if (exists) return res.status(400).json({ error: 'CPF já cadastrado.' });
        }

        const student = await Student.create({
            ...req.body,
            userId, // Creator
            unitId: [1, 10].includes(Number(req.user.roleId)) ? (req.body.unitId ? Number(req.body.unitId) : null) : unitId
        });
        res.status(201).json(student);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

const { ROLE_IDS } = require('../config/roles');

// PUT /students/:id - Atualizar
router.put('/:id', auth, async (req, res) => {
    try {
        const { roleId } = req.user;
        // Restrictions: Instructors and Consultants cannot manage/edit active students structure (status, class)
        // Allowed: Master, Director, Franchisee, Manager, Leaders, Admin-Fin
        const allowed = [
            ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR,
            ROLE_IDS.FRANCHISEE, ROLE_IDS.MANAGER,
            ROLE_IDS.LEADER_PEDAGOGICAL, ROLE_IDS.LEADER_SALES,
            ROLE_IDS.ADMIN_FINANCIAL
        ];

        if (!allowed.includes(roleId)) {
            return res.status(403).json({ error: 'Sem permissão para editar dados do aluno.' });
        }

        const student = await Student.findByPk(req.params.id);
        if (!student) return res.status(404).json({ error: 'Aluno não encontrado' });

        // Unit Isolation check
        if (!checkUnitIsolation(res, req.user, student.unitId)) return;

        await student.update(req.body);
        res.json(student);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
