const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// Sync model on load (optional, usually done in index or separate script)
// Task.sync({ alter: true }).catch(err => console.log('Task sync error:', err));

// Listar todas as tarefas (Filtrado por unidade)
router.get('/', auth, async (req, res) => {
    try {
        const { unitId, role } = req.user;
        let where = {};

        if (role !== 'master' && unitId) {
            where.unitId = unitId;
        }

        const tasks = await Task.findAll({ where });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Criar nova tarefa
router.post('/', auth, async (req, res) => {
    try {
        const { unitId } = req.user;
        const taskData = { ...req.body };

        // Force unitId from token for non-masters
        if (req.user.role !== 'master') {
            taskData.unitId = unitId;
        } else if (!taskData.unitId) {
            // Master can specify unitId, or defaults to null (Global)?
            // Maybe default to null if not provided
        }

        const task = await Task.create(taskData);
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Atualizar tarefa
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { unitId, role } = req.user;

        const where = { id };
        if (role !== 'master' && unitId) {
            where.unitId = unitId;
        }

        const [updated] = await Task.update(req.body, { where });

        if (!updated && role !== 'master') {
            // If not updated, implies maybe task doesn't exist OR belongs to another unit
            // Check if exists? For now just return success false
            // Actually findAll/check is better but simpler for now implies security via WHERE clause
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Deletar tarefa
// Deletar tarefa
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { unitId, role } = req.user;

        const where = { id };
        if (role !== 'master' && unitId) {
            where.unitId = unitId;
        }

        await Task.destroy({ where });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
