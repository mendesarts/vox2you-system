const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const DEBUG_FILE = path.join(__dirname, '../debug-classes.log');
const logDebug = (msg) => { /* Disabled for Prod Stability */ };
const Class = require('../models/Class');
const Course = require('../models/Course');
const User = require('../models/User');
const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');
const { generateScheduleForClass } = require('../utils/scheduleGenerator');
const Module = require('../models/Module');
const Holiday = require('../models/Holiday');
const ClassSession = require('../models/ClassSession');
const { Op } = require('sequelize');
const { checkUnitIsolation } = require('../utils/unitIsolation');

const auth = require('../middleware/auth');
const { ROLE_IDS } = require('../config/roles');

// Helper for Hash ID
const getNumericId = (id) => {
    if (!id) return null;
    if (!isNaN(Number(id))) return Number(id);
    let hash = 0;
    const str = String(id);
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
    return Math.abs(hash);
};

// GET /classes (turmas)
router.get('/', auth, async (req, res) => {
    try {
        const { unitId } = req.user;
        const { roleId, id } = req.user;
        const where = {};
        const numericUnitId = unitId ? getNumericId(unitId) : null;

        logDebug(`GET /classes User: RoleID=${roleId} ID=${id} Unit=${unitId} NumUnit=${numericUnitId}`);

        // Filter by Unit for non-Masters/Directors
        if (![ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(roleId) && numericUnitId) {
            where.unitId = numericUnitId;
        }

        // Filter by Professor for Instructor Role
        if (roleId === ROLE_IDS.INSTRUCTOR) {
            where.professorId = id;
        }

        const classes = await Class.findAll({
            where,
            include: [
                { model: Course },
                { model: User, as: 'professor' },
                { model: Student },
                { model: Enrollment }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(classes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /classes/:id
router.get('/:id', auth, async (req, res) => {
    try {
        const classObj = await Class.findByPk(req.params.id, {
            include: [
                { model: Course },
                { model: User, as: 'professor' }
            ]
        });
        if (!classObj) return res.status(404).json({ error: 'Turma não encontrada' });

        // Verificação de isolamento
        if (!checkUnitIsolation(res, req.user, classObj.unitId)) return;

        res.json(classObj);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /classes/:id/students
router.get('/:id/students', auth, async (req, res) => {
    try {
        const classObj = await Class.findByPk(req.params.id);
        if (!classObj) return res.status(404).json({ error: 'Turma não encontrada' });
        if (!checkUnitIsolation(res, req.user, classObj.unitId)) return;

        const students = await Student.findAll({
            where: { classId: req.params.id }
        });
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Role Check Middleware for Class Management
const checkClassManageAccess = (req, res, next) => {
    const allowed = [
        ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR,
        ROLE_IDS.FRANCHISEE, ROLE_IDS.MANAGER,
        ROLE_IDS.LEADER_PEDAGOGICAL,
        ROLE_IDS.ADMIN_FINANCIAL
    ];
    if (allowed.includes(req.user.roleId)) {
        next();
    } else {
        res.status(403).json({ error: 'Permissão negada. Apenas Gestão e Liderança Pedagógica podem gerenciar turmas.' });
    }
};

// POST /classes
router.post('/', auth, checkClassManageAccess, async (req, res) => {
    try {
        logDebug('POST /classes payload: ' + JSON.stringify(req.body));
        console.log('POST /classes payload:', req.body);
        const { unitId } = req.user;
        const numericUnitId = unitId ? getNumericId(unitId) : null;

        const newClass = await Class.create({
            ...req.body,
            unitId: [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(req.user.roleId) ? (req.body.unitId || null) : numericUnitId
        });
        logDebug(`New Class created: ${newClass.id} by ${req.user.name}`);

        let warning = null;
        try {
            await generateScheduleForClass(newClass.id);
        } catch (scheduleError) {
            console.error('Auto-Schedule Failed:', scheduleError.message);
            warning = 'Aviso: Cronograma vazio. ' + scheduleError.message;
        }

        const response = newClass.toJSON();
        if (warning) response.warning = warning;

        res.status(201).json(response);
    } catch (error) {
        logDebug('POST ERROR: ' + error.message + ' STACK: ' + error.stack);
        res.status(400).json({ error: error.message });
    }
});

// PUT /classes/:id
router.put('/:id', auth, checkClassManageAccess, async (req, res) => {
    try {
        const classObj = await Class.findByPk(req.params.id);
        if (!classObj) return res.status(404).json({ error: 'Turma não encontrada' });

        if (!checkUnitIsolation(res, req.user, classObj.unitId)) return;

        const { startDate, days, startTime, unitId } = req.body;
        const needsReschedule = startDate !== classObj.startDate ||
            JSON.stringify(days) !== JSON.stringify(classObj.days) ||
            startTime !== classObj.startTime;

        let targetUnitId = classObj.unitId;
        if (unitId !== undefined) {
            targetUnitId = [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(req.user.roleId) ? (unitId || null) : getNumericId(unitId);
        }

        await classObj.update({
            ...req.body,
            unitId: targetUnitId
        });

        if (needsReschedule) {
            await generateScheduleForClass(classObj.id);
        }

        res.json(classObj);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE /classes/:id
router.delete('/:id', auth, checkClassManageAccess, async (req, res) => {
    try {
        const classObj = await Class.findByPk(req.params.id);
        if (!classObj) return res.status(404).json({ error: 'Turma não encontrada' });

        if (!checkUnitIsolation(res, req.user, classObj.unitId)) return;

        await classObj.destroy();
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /classes/:id/generate-schedule
router.post('/:id/generate-schedule', auth, checkClassManageAccess, async (req, res) => {
    try {
        const classObj = await Class.findByPk(req.params.id);
        if (!classObj) return res.status(404).json({ error: 'Turma não encontrada' });
        if (!checkUnitIsolation(res, req.user, classObj.unitId)) return;

        const result = await generateScheduleForClass(req.params.id);
        res.json({
            message: 'Cronograma gerado com sucesso',
            ...result
        });
    } catch (error) {
        console.error(error);
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
