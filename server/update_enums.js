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

async function addEnumValues() {
    try {
        console.log('🔄 Conectando para atualizar ENUMs...');
        await sequelize.authenticate();

        const newRoles = ['pedagogical_leader', 'manager'];

        for (const role of newRoles) {
            try {
                await sequelize.query(`ALTER TYPE "enum_Users_role" ADD VALUE '${role}'`);
                console.log(`✅ ENUM value '${role}' added.`);
            } catch (e) {
                // Ignore if exists
                console.log(`ℹ️ Role '${role}' check: ${e.original?.code === '42710' ? 'Already exists' : e.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await sequelize.close();
    }
}

addEnumValues();
