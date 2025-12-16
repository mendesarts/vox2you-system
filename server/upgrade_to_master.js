const { Sequelize, DataTypes } = require('sequelize');
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

async function upgradeToMaster() {
    try {
        console.log('🔄 Conectando ao Banco de Dados...');
        await sequelize.authenticate();

        const email = 'novo.admin@voxflow.com';

        // Using raw query to avoid model definition mismatches if local models are outdated
        // But we need to know if the enum content allows 'master'. 
        // Based on User.js model viewed earlier: 'master', 'franchisee', 'manager' etc. exists.

        const [results] = await sequelize.query(
            "UPDATE \"Users\" SET role = 'master' WHERE email = :email RETURNING id, name, email, role",
            {
                replacements: { email: email }
            }
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

upgradeToMaster();
