const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = 'vox2you-secret-key-change-in-prod';

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Trim inputs to avoid whitespace issues
        const cleanEmail = email ? email.trim() : '';
        const cleanPassword = password ? password.trim() : '';

        // 1. Buscar usuário
        const user = await User.findOne({ where: { email: cleanEmail } });
        if (!user) {
            return res.status(401).json({ message: 'Email ou senha inválidos' });
        }

        const bcrypt = require('bcryptjs');

        // 2. Verificar senha (Suporte Híbrido: Hash ou Texto Plano)
        let isValidId = false;

        // Tenta verificar se é hash
        if (user.password.startsWith('$2')) {
            isValidId = await bcrypt.compare(cleanPassword, user.password);
        } else {
            // Fallback para legado (texto plano)
            isValidId = user.password === cleanPassword;
        }

        if (!isValidId) {
            return res.status(401).json({ message: 'Email ou senha inválidos' });
        }

        // 3. Gerar Token
        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.name, unitId: user.unitId },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                color: user.color
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
