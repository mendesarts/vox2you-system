const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false
});

async function fixEnumAndUpgrade() {
    try {
        console.log('🔄 Conectando para corrigir ENUM...');
        await sequelize.authenticate();

        // 1. Alter Enum (PostgreSQL specific)
        try {
            await sequelize.query("ALTER TYPE \"enum_Users_role\" ADD VALUE 'master'");
            console.log('✅ ENUM type updated to include master.');
        } catch (e) {
            console.log('ℹ️ Enum fix details:', e.original.code); // 42710 = duplicate value (already exists)
            // If it fails, it might already exist or be in a different state, but we proceed.
        }

        // 2. Update User
        const email = 'novo.admin@voxflow.com';
        const [results] = await sequelize.query(
            "UPDATE \"Users\" SET role = 'master' WHERE email = :email RETURNING id, name, email, role",
            { replacements: { email: email } }
        );

        if (results && results.length > 0) {
            console.log(`✅ Sucesso! Usuário ${email} agora é MASTER.`);
            console.log(results[0]);
        } else {
            console.log(`❌ Usuário ${email} não encontrado.`);
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await sequelize.close();
    }
}

fixEnumAndUpgrade();
