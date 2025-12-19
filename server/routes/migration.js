const express = require('express');
const router = express.Router();
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('../models/User');
const Unit = require('../models/Unit');
const { ROLE_IDS, getRoleId } = require('../config/roles');

router.get('/run-now', async (req, res) => {
    const logs = [];
    const log = (msg) => logs.push(msg);

    try {
        log('🔄 Iniciando Migração de Dados (User IDs & Units)...');

        // 1. Manually add columns if missing (Schema Drift Fix)
        const qi = sequelize.getQueryInterface();
        const colsToAdd = [
            { name: 'roleId', type: DataTypes.INTEGER },
            { name: 'unitId', type: DataTypes.UUID },
            { name: 'unit', type: DataTypes.STRING },
            { name: 'password', type: DataTypes.STRING },
            { name: 'phone', type: DataTypes.STRING },
            { name: 'whatsapp', type: DataTypes.STRING },
            { name: 'avatar', type: DataTypes.STRING },
            { name: 'profilePicture', type: DataTypes.TEXT },
            { name: 'lastLogin', type: DataTypes.DATE }
        ];

        for (const col of colsToAdd) {
            try {
                await qi.addColumn('Users', col.name, { type: col.type, allowNull: true });
                log(`✅ Coluna ${col.name} verificada/adicionada.`);
            } catch (e) {
                // log(`ℹ️ Coluna ${col.name} já existe.`);
            }
        }

        // 2. Fetch Users
        const users = await User.findAll();
        log(`📊 Encontrados ${users.length} usuários para migrar.`);

        // 3. Find/Create Target Unit "Brasília.ÁguasClaras"
        let targetUnit = await Unit.findOne({ where: { name: 'Brasília.ÁguasClaras' } });
        if (!targetUnit) {
            const pUnit = await Unit.findOne({ where: { name: 'Brasília' } });
            if (pUnit) {
                log("⚠️ Unidade exata não achada, usando 'Brasília' e renomeando...");
                pUnit.name = 'Brasília.ÁguasClaras';
                await pUnit.save();
                targetUnit = pUnit;
            } else {
                log("🆕 Criando unidade 'Brasília.ÁguasClaras'...");
                targetUnit = await Unit.create({
                    name: 'Brasília.ÁguasClaras',
                    active: true,
                    city: 'Brasília'
                });
            }
        }
        log(`🏢 Unidade Alvo UUID: ${targetUnit.id}`);

        // 4. Migrate Loop
        for (const u of users) {
            let changed = false;

            // A. Role Migration
            const startRole = u.role;
            const startRoleId = u.roleId;
            const freshRoleId = getRoleId(startRole);

            if (freshRoleId !== 0 && freshRoleId !== startRoleId) {
                u.roleId = freshRoleId;
                changed = true;
                log(`👤 User ${u.email}: Role '${startRole}' -> ID ${freshRoleId}`);
            } else if (!u.roleId) {
                u.roleId = ROLE_IDS.CONSULTANT; // 41
                changed = true;
                log(`⚠️ User ${u.email}: Role desconhecida '${startRole}' -> Forçando ID 41`);
            }

            // B. Unit Migration
            // Se não tiver UnitID, vincular à Brasília.ÁguasClaras
            if (!u.unitId) {
                u.unitId = targetUnit.id;
                u.unit = targetUnit.name;
                changed = true;
                log(`🏢 User ${u.email}: Linked to Unit ${targetUnit.name}`);
            }

            if (changed) {
                await u.save();
            }
        }

        log('✅ Migração concluída com sucesso!');
        res.json({ success: true, logs });
    } catch (error) {
        log(`❌ Erro fatal: ${error.message}`);
        res.status(500).json({ success: false, logs, error: error.message });
    }
});

module.exports = router;
