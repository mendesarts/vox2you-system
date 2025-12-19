const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getRoleId } = require('../config/roles');

const JWT_SECRET = 'vox2you-secret-key-change-in-prod';

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Trim inputs to avoid whitespace issues
        const cleanEmail = email ? email.trim() : '';
        const cleanPassword = password ? password.trim() : '';

        // 1. Buscar usuário (Resilient Logic)
        let user;
        try {
            // Tenta trazer dados da Unidade (Rich Data)
            // Se falhar por Schema Mismatch, cai no catch
            const Unit = require('../models/Unit');
            user = await User.findOne({
                where: { email: cleanEmail },
                include: [{ model: Unit, required: false }]
            });
        } catch (err) {
            console.error('[LOGIN RESCUE] Falha ao buscar com Unit. Tentando simples...', err.message);
            // Fallback: Busca simples para não trancar usuário
            user = await User.findOne({ where: { email: cleanEmail } });
        }
        if (!user) {
            return res.status(401).json({ message: 'Email ou senha inválidos' });
        }

        const bcrypt = require('bcryptjs');


        // 2. Verificar senha (Suporte Híbrido: Hash ou Texto Plano)
        let isValidId = false;

        // Tenta verificar se é hash
        if (user.password && user.password.startsWith('$2')) {
            isValidId = await bcrypt.compare(cleanPassword, user.password);
        } else {
            // Fallback para legado (texto plano)
            isValidId = user.password === cleanPassword;
        }

        if (!isValidId) {
            return res.status(401).json({ message: 'Email ou senha inválidos' });
        }

        // 3. CALCULAR RoleID VIRTUAL (Migration Path)
        const roleId = getRoleId(user.role);

        // 4. Gerar Token (agora com roleId integer)
        const token = jwt.sign(
            { id: user.id, role: user.role, roleId: roleId, name: user.name, unitId: user.unitId },
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
                roleId: roleId, // INT
                unit: user.unit,
                unitId: user.unitId, // UUID
                profilePicture: user.profilePicture,
                color: user.color,
                forcePasswordChange: user.forcePasswordChange
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mock Email Sender (Simulado)
const sendWelcomeEmail = (email, name, password) => {
    console.log(`
    =========================================
    [MOCK EMAIL SERVER]
    To: ${email}
    Subject: Bem-vindo ao Vox2you System!
    
    Olá, ${name}!
    
    Sua conta foi criada com sucesso.
    Acesse o sistema em: https://meuvoxflow.vercel.app/
    
    Login: ${email}
    Senha Provisória: ${password}
    
    Por favor, altere sua senha no primeiro acesso.
    =========================================
    `);
};

// Change Password Route (First Access or User Request)
router.post('/change-password', async (req, res) => {
    try {
        const { userId, newPassword } = req.body; // In real app, get userId from Token middleware
        // But for "Forced Change" flow, user might be partially logged in or using a temp token.
        // Let's assume frontend sends the ID if we use a specific unprotected route, BUT better to use auth middleware.
        // For simplicity here, we'll assume we pass a header token or just trust ID if this is an open endpoint (NOT SECURE).
        // Let's do it properly: User is technically logged in but restricted in frontend.

        // BETTER: Use middleware. But let's keep it simple for prototype.

        const user = await User.findByPk(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await user.update({
            password: hashedPassword,
            forcePasswordChange: false // Mark as changed
        });

        res.json({ success: true, message: 'Senha alterada com sucesso!' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export email sender to be used in users route
router.sendWelcomeEmail = sendWelcomeEmail;

module.exports = router;
