const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Unit = require('../models/Unit');
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

// Buscar todos os usuários (com filtros de segurança)
// Buscar todos os usuários (com filtros de segurança)
const { ROLE_IDS, getRoleId } = require('../config/roles');

router.get('/', auth, async (req, res) => {
    try {
        const { roleId, unitId, id } = req.user;
        let where = {};

        // PERMISSÕES POR ID (Strict)
        // 1 & 10 (Master/Director) -> View All
        if (roleId === ROLE_IDS.MASTER || roleId === ROLE_IDS.DIRECTOR) {
            // Global Access
        }
        // 20, 30, 40, 50, 60 -> Unit Isolation
        else if ([ROLE_IDS.FRANCHISEE, ROLE_IDS.MANAGER, ROLE_IDS.LEADER_SALES, ROLE_IDS.LEADER_PEDAGOGICAL, ROLE_IDS.ADMIN_FINANCIAL].includes(roleId)) {
            if (!unitId) return res.json([]);
            where.unitId = unitId;
        } else {
            // Operacional: Vê apenas o próprio perfil
            where.id = id;
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
        const { name, email, password, role, unit, unitId, whatsapp, position, profilePicture } = req.body;
        const requester = req.user;

        // 0. Determinar ID do Cargo solicitado
        const targetRoleId = getRoleId(role);

        // 1. Permissões de Criação
        // Only Master(1), Director(10), Franchisee(20), Manager(30) can create users
        if (![ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR, ROLE_IDS.FRANCHISEE, ROLE_IDS.MANAGER].includes(requester.roleId)) {
            return res.status(403).json({ error: 'Permissão negada. Cargo sem autorização para criar usuários.' });
        }

        let targetUnitId = unitId;

        // 2. Herança de Unidade
        // Se o criador NÃO for Global (Master/Director), ele só pode criar na própria unidade
        const isGlobalCreator = [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(requester.roleId);

        if (!isGlobalCreator) {
            targetUnitId = requester.unitId; // Override forced

            // 3. Restrições de Hierarquia (Anti-Escalada)
            // Franqueado(20) não pode criar Master(1), Diretor(10), ou outro Franqueado(20)
            if (targetRoleId <= ROLE_IDS.FRANCHISEE) {
                return res.status(403).json({ error: 'Permissão negada. Você não pode criar cargos superiores ou equivalentes.' });
            }
        } else {
            // Se for Master/Director e não enviou unitId, tenta resolver por unitName (Retrocompatibilidade)
            const { unitName } = req.body;
            if (!targetUnitId && unitName) {
                const existingUnit = await Unit.findOne({ where: { name: unitName } });
                if (existingUnit) {
                    targetUnitId = existingUnit.id;
                } else {
                    // Create on the fly
                    const newUnit = await Unit.create({
                        name: unitName,
                        city: 'Matriz', // Default
                        active: true
                    });
                    targetUnitId = newUnit.id;
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
            unit: unit || "Sem Unidade", // Persistência Explícita (String)
            whatsapp,
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
