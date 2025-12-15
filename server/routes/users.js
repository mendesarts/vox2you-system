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
            // Outros cargos vêm apenas a si mesmos ou talvez sua equipe (por enquanto restringir a si mesmo ou nada?)
            // O request pede "Líderes verão dados dos liderados". Implementaçao complexa. 
            // Para "Listagem de Usuários" (tela de admin), geralmente só Gestores+ acessam.
            // Vamos assumir que apenas Gestores+ acessam essa rota por enquanto ou retornam apenas eles mesmos.
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
        if (!['master', 'franchisee', 'manager'].includes(requester.role)) {
            return res.status(403).json({ error: 'Permissão negada. Apenas Gestores e Diretores podem criar usuários.' });
        }

        // 2. Restrições de Unidade
        let targetUnitId = unitId;
        if (requester.role !== 'master') {
            // Se não for master, FORÇA a unidade do criador
            targetUnitId = requester.unitId;

            // Se tentar criar um cargo maior que o proprio (ex: gestor criando master) -> Bloquear
            if (['master'].includes(role)) {
                return res.status(403).json({ error: 'Você não pode criar este tipo de cargo.' });
            }
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
            profilePicture // Base64 string from frontend
        });

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
        const updates = req.body;

        const userToUpdate = await User.findByPk(id);
        if (!userToUpdate) return res.status(404).json({ error: 'Usuário não encontrado' });

        // Verificação de Permissão para Editar
        let canEdit = false;
        if (requester.role === 'master') canEdit = true;
        else if (requester.unitId === userToUpdate.unitId && ['franchisee', 'manager'].includes(requester.role)) canEdit = true;
        else if (requester.id === userToUpdate.id) canEdit = true; // Próprio usuário

        if (!canEdit) return res.status(403).json({ error: 'Sem permissão para editar este usuário.' });

        // Se for atualizar senha, hashear
        if (updates.password) {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(updates.password, salt);
        }

        // Proteção: Não deixar mudar unitId ou role se não for Master (ou regras especificas)
        if (requester.role !== 'master') {
            delete updates.unitId;
            delete updates.role; // Evitar escalação de privilégio
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
