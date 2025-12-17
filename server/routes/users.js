const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Unit = require('../models/Unit');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

// Buscar todos os usuários (com filtros de segurança)
router.get('/', auth, async (req, res) => {
    try {
        const { role, unitId } = req.user;
        let where = {};

        // Regras de Visualização
        if (role === 'master') {
            // Master vê tudo
        } else if (['franchisee', 'manager'].includes(role)) {
            // Franqueado/Gestor vê apenas sua unidade
            where.unitId = unitId;
        } else {
            // Outros cargos vêem APENAS o próprio perfil para edição
            where.id = req.user.id;
        }

        const users = await User.findAll({
            where,
            attributes: { exclude: ['password'] },
            order: [['name', 'ASC']]
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Criar novo usuário (com validações de segurança)
router.post('/', auth, async (req, res) => {
    try {
        const { name, email, password, role, unitId, whatsapp, position, profilePicture } = req.body;
        const requester = req.user;

        // 1. Permissões de Criação
        // Apenas Master, Diretor, Franqueado e Gestor podem criar contas
        if (!['master', 'director', 'franchisee', 'manager'].includes(requester.role)) {
            return res.status(403).json({ error: 'Permissão negada. Você não tem permissão para criar usuários.' });
        }

        // 2. Restrições de Unidade e Hierarquia
        let targetUnitId = unitId;

        // Se for Master e enviou unitName ao invés de unitId => Buscar ou Criar Unidade
        const { unitName } = req.body;
        if (requester.role === 'master' && !targetUnitId && unitName) {
            // Check if unit exists
            const existingUnit = await Unit.findOne({ where: { name: unitName } });
            if (existingUnit) {
                targetUnitId = existingUnit.id;
            } else {
                // Create new Unit on the fly
                const newUnit = await Unit.create({
                    name: unitName,
                    city: unitName.split('.')[0] || 'Matriz', // Simple inference
                    active: true
                });
                targetUnitId = newUnit.id;
            }
        }

        if (requester.role !== 'master' && requester.role !== 'director') {
            // Se não for master/diretor, FORÇA a unidade do criador? 
            // User says Director creates other Directors. Directors might be global or unit bound?
            // "O diretor pode criar outros diretores... mas não é master".
            // If director is unit-bound, they can't create global users.
            // Let's assume Director is effectively a Sub-Master (Global or Multi-Unit).
            // For safety, let's say Director *can* set unitId but creates with restriction?
            // Actually, usually Director is top-level.

            targetUnitId = requester.unitId;

            targetUnitId = requester.unitId;

            // Hierarquia Restritiva para Franqueado e Gestor
            if (['franchisee', 'manager'].includes(requester.role)) {
                // Não podem criar: Master, Diretor, Franqueado, Gestor
                if (['master', 'director', 'franchisee', 'manager'].includes(role)) {
                    return res.status(403).json({ error: 'Permissão negada. Você não pode criar cargos de nível gerencial ou superior.' });
                }
            }
        }

        // Diretor Creation Rules (if Director is creating)
        if (requester.role === 'director') {
            if (role === 'master') {
                return res.status(403).json({ error: 'Diretores não podem criar contas Master.' });
            }
            // Director CAN create other Directors.
        }

        // 3. Validação de Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Email inválido.' });
        }

        // 4. Hash da Senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 5. Salvar Usuário
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            unitId: targetUnitId,
            whatsapp,
            position,
            profilePicture, // Base64 string from frontend
            forcePasswordChange: true // Garantir que novos usuários mudem a senha
        });

        // 6. Enviar Email de Boas Vindas (Mock)
        // Check if the mock function exists (it's attached to auth router, so we need to import or duplicate)
        // Duplicating simple log here for robustness
        console.log(`
        =========================================
        [MOCK EMAIL SERVICE]
        To: ${email}
        Subject: Bem-vindo ao Vox2you - Suas Credenciais

        Olá, ${name}!
        Bem-vindo à unidade ${targetUnitId ? 'Sua Unidade' : 'Matriz'}.
        
        Acesse: https://meuvoxflow.vercel.app/
        Login: ${email}
        Senha Provisória: ${password}
        
        Você será solicitado a criar uma nova senha no primeiro acesso.
        =========================================
        `);

        const userResponse = user.toJSON();
        delete userResponse.password;

        res.status(201).json(userResponse);
    } catch (error) {
        console.error('Create User Error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Atualizar Usuário
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const requester = req.user;
        // Clone body to manipulate
        const updates = { ...req.body };

        const userToUpdate = await User.findByPk(id);
        if (!userToUpdate) return res.status(404).json({ error: 'Usuário não encontrado' });

        // Verificação de Permissão para Editar
        let canEdit = false;
        if (requester.role === 'master' || requester.role === 'director') canEdit = true;
        else if (requester.unitId === userToUpdate.unitId && ['franchisee', 'manager'].includes(requester.role)) canEdit = true;
        else if (requester.id === userToUpdate.id) canEdit = true; // Próprio usuário

        // Director cannot edit Master
        if (requester.role === 'director' && userToUpdate.role === 'master') canEdit = false;
        else if (requester.id === userToUpdate.id) canEdit = true; // Próprio usuário

        if (!canEdit) return res.status(403).json({ error: 'Sem permissão para editar este usuário.' });

        // Se for atualizar senha (e não for vazia)
        if (updates.password && updates.password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(updates.password, salt);
        } else {
            delete updates.password; // Remove field to prevent overwriting with empty
        }

        // Proteção: Não deixar mudar unitId ou role se não for Master/Director
        if (!['master', 'director'].includes(requester.role)) {
            delete updates.unitId;
            delete updates.role; // Evitar escalação de privilégio
        }

        // Director cannot promote to Master
        if (requester.role === 'director' && updates.role === 'master') {
            delete updates.role;
        }

        await userToUpdate.update(updates);
        res.json({ success: true });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Deletar usuário
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const requester = req.user;

        const userToDelete = await User.findByPk(id);
        if (!userToDelete) return res.status(404).json({ error: 'Usuário não encontrado' });

        // Apenas Master ou Franqueado/Gestor da MESMA unidade podem deletar
        if (requester.role !== 'master') {
            if (userToDelete.unitId !== requester.unitId || !['franchisee', 'manager'].includes(requester.role)) {
                return res.status(403).json({ error: 'Sem permissão para deletar este usuário.' });
            }
        }

        await userToDelete.destroy();
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
