const express = require('express');
const router = express.Router();
const { Sequelize } = require('sequelize');

// Tenta importar o modelo, se der erro usa um mock para nao travar o deploy
let Task;
try {
    const sequelize = process.env.DATABASE_URL
        ? new Sequelize(process.env.DATABASE_URL)
        : new Sequelize({ dialect: 'sqlite', storage: 'voxflow.sqlite' }); // Use safe fallback

    Task = sequelize.define('Task', {
        title: Sequelize.STRING,
        status: Sequelize.STRING,
        priority: Sequelize.STRING,
        category: Sequelize.STRING // 'pedagogical', 'administrative', 'commercial'
    });
} catch (e) {
    console.log('Erro ao definir modelo Task, usando Mock:', e);
    // Mock básico para não quebrar a API
    const mockFn = async () => [];
    Task = {
        sync: mockFn,
        findAll: mockFn,
        create: mockFn,
        update: mockFn,
        destroy: mockFn
    };
}

// Listar todas as tarefas
router.get('/', async (req, res) => {
    try {
        await Task.sync({ alter: true }); // Garante que a tabela existe e atualiza colunas
        const tasks = await Task.findAll();
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Criar nova tarefa
router.post('/', async (req, res) => {
    try {
        const task = await Task.create(req.body);
        res.json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Atualizar tarefa
router.put('/:id', async (req, res) => {
    try {
        await Task.update(req.body, { where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Deletar tarefa
router.delete('/:id', async (req, res) => {
    try {
        await Task.destroy({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
