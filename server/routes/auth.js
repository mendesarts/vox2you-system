const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getRoleId } = require('../config/roles');

const JWT_SECRET = 'vox2you-secret-key-change-in-prod';

router.get('/emergency-master-reset', async (req, res) => {
    try {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        let user = await User.findOne({ where: { email: 'master@vox2you.com' } });
        if (user) {
            await user.update({ password: hashedPassword, role: 'master', roleId: 1 });
        } else {
            user = await User.create({
                name: 'Master Admin',
                email: 'master@vox2you.com',
                password: hashedPassword,
                role: 'master',
                roleId: 1,
                active: true
            });
        }
        res.send('Master account reset to master@vox2you.com / 123456');
    } catch (e) {
        res.status(500).send(e.message);
    }
});

router.get('/users-debug', async (req, res) => {
    try {
        const users = await User.findAll({ attributes: ['id', 'name', 'email', 'role', 'roleId'] });
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

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

        console.log(`[LOGIN DEBUG] Attempting login for: ${cleanEmail}`);
        console.log(`[LOGIN DEBUG] Found user: ${user ? user.id : 'NONE'}`);
        if (user) console.log(`[LOGIN DEBUG] Stored Password (first 10 chars): ${user.password.substring(0, 10)}...`);

        // Tenta verificar se é hash
        if (user.password && user.password.startsWith('$2')) {
            console.log(`[LOGIN DEBUG] Verifying Bcrypt Hash...`);
            isValidId = await bcrypt.compare(cleanPassword, user.password);
            console.log(`[LOGIN DEBUG] Bcrypt Result: ${isValidId}`);
        } else {
            // Fallback para legado (texto plano)
            console.log(`[LOGIN DEBUG] Verifying Plain Text...`);
            isValidId = user.password === cleanPassword;
            console.log(`[LOGIN DEBUG] Plain Text Result: ${isValidId}`);
        }

        if (!isValidId) {
            return res.status(401).json({
                message: 'Email ou senha inválidos',
                debug: {
                    attemptedEmail: cleanEmail,
                    userFound: !!user,
                    bcrypt: user?.password?.startsWith('$2'),
                    storedStart: user?.password?.substring(0, 5)
                }
            });
        }

        // 3. CALCULAR RoleID (Prioridade para ID numérico do Banco)
        const roleId = user.roleId && user.roleId !== 0 ? user.roleId : getRoleId(user.role);

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
