const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Buscar todos os usuários
router.get('/', async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] } // Não retornar senhas
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Criar novo usuário
router.post('/', async (req, res) => {
    try {
        const { name, email, password, role, color } = req.body;

        // TODO: Hash password before saving in production
        const user = await User.create({
            name,
            email,
            password, // Plain text for prototype
            role,
            color
        });

        const userResponse = user.toJSON();
        delete userResponse.password;

        res.status(201).json(userResponse);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Deletar usuário (Soft delete ou hard delete)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await User.destroy({ where: { id } });
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
