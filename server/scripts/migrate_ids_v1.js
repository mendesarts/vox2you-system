const sequelize = require('../config/database');
const User = require('../models/User');
const Unit = require('../models/Unit');
const { ROLE_IDS, getRoleId } = require('../config/roles');

const runMigration = async () => {
    try {
        console.log('🔄 Iniciando Migração de Dados (User IDs & Units)...');
        await sequelize.authenticate();

        // 1. Manually add column if missing (Safe Mode)
        const qi = sequelize.getQueryInterface();
        try {
            await qi.addColumn('Users', 'roleId', {
                type: sequelize.Sequelize.INTEGER,
                allowNull: true
            });
            console.log('✅ Coluna roleId adicionada.');
        } catch (e) {
            console.log('ℹ️ Coluna roleId já existe ou erro ignorável:', e.message);
        }

        try {
            // Ensure unitId exists too
            await qi.addColumn('Users', 'unitId', {
                type: sequelize.Sequelize.UUID,
                allowNull: true
            });
            console.log('✅ Coluna unitId adicionada.');
        } catch (e) {
            console.log('ℹ️ Coluna unitId já existe.');
        }

        try {
            await qi.addColumn('Users', 'password', {
                type: sequelize.Sequelize.STRING,
                allowNull: true
            });
            console.log('✅ Coluna password adicionada (Correção de Schema).');
        } catch (e) {
            console.log('ℹ️ Coluna password verificação ok.');
        }

        try {
            await qi.addColumn('Users', 'unit', {
                type: sequelize.Sequelize.STRING,
                allowNull: true
            });
            console.log('✅ Coluna unit adicionada (Correção de Schema).');
        } catch (e) {
            console.log('ℹ️ Coluna unit verificação ok.');
        }

        const missingCols = ['phone', 'whatsapp', 'avatar', 'profilePicture', 'lastLogin'];
        for (const col of missingCols) {
            try {
                let type = sequelize.Sequelize.STRING;
                if (col === 'profilePicture') type = sequelize.Sequelize.TEXT;
                if (col === 'lastLogin') type = sequelize.Sequelize.DATE;

                await qi.addColumn('Users', col, { type, allowNull: true });
                console.log(`✅ Coluna ${col} adicionada.`);
            } catch (e) {
                // Ignore
            }
        }

        // 2. Fetch Users
        const users = await User.findAll();
        console.log(`📊 Encontrados ${users.length} usuários para migrar.`);

        // 3. Find/Create Target Unit "Brasília.ÁguasClaras"
        let targetUnit = await Unit.findOne({ where: { name: 'Brasília.ÁguasClaras' } });
        if (!targetUnit) {
            // Try partial match
            const pUnit = await Unit.findOne({ where: { name: 'Brasília' } });
            if (pUnit) {
                // Rename or Use? Let's use it.
                console.log("⚠️ Unidade exata não achada, usando 'Brasília' e renomeando...");
                pUnit.name = 'Brasília.ÁguasClaras';
                await pUnit.save();
                targetUnit = pUnit;
            } else {
                console.log("🆕 Criando unidade 'Brasília.ÁguasClaras'...");
                targetUnit = await Unit.create({
                    name: 'Brasília.ÁguasClaras',
                    active: true,
                    city: 'Brasília'
                });
            }
        }
        console.log(`🏢 Unidade Alvo UUID: ${targetUnit.id}`);

        // 4. Migrate Loop
        for (const u of users) {
            let changed = false;

            // A. Role Migration
            const startRole = u.role;
            const startRoleId = u.roleId; // likely null

            // Calculate logic ID
            const freshRoleId = getRoleId(startRole);

            if (freshRoleId !== 0 && freshRoleId !== startRoleId) {
                u.roleId = freshRoleId;
                changed = true;
                console.log(`👤 User ${u.email}: Role '${startRole}' -> ID ${freshRoleId}`);
            } else if (!u.roleId) {
                // Unknown role? Default to Consultant (Sales)
                u.roleId = ROLE_IDS.CONSULTANT; // 41
                changed = true;
                console.warn(`⚠️ User ${u.email}: Role desconhecida '${startRole}' -> Forçando ID 41 (Consultor)`);
            }

            // B. Unit Migration
            // Se não tiver UnitID, vincular à Brasília.ÁguasClaras
            // (Temporary measure: All users without Unit go to main Unit)
            if (!u.unitId) {
                u.unitId = targetUnit.id;
                u.unit = targetUnit.name; // Sync name
                changed = true;
                console.log(`🏢 User ${u.email}: Linked to Unit ${targetUnit.name}`);
            } else {
                // Checks consistency
                // If role is Franchisee/Manager, enforce valid UnitId
            }

            if (changed) {
                await u.save();
            }
        }

        console.log('✅ Migração concluída com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        process.exit(1);
    }
};

runMigration();
