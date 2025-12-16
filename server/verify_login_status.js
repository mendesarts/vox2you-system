const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Force use of the production URL we set earlier
const databaseUrl = process.env.DATABASE_URL;

const sequelize = new Sequelize(databaseUrl, {
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

async function verifyUser() {
    try {
        console.log('🔄 Conectando ao Banco de Dados...');
        await sequelize.authenticate();

        const email = 'novo.admin@voxflow.com';
        const [results] = await sequelize.query(
            "SELECT id, name, email, role, active FROM \"Users\" WHERE email = :email",
            { replacements: { email: email } }
        );

        if (results && results.length > 0) {
            console.log('✅ Usuário encontrado:');
            console.log(results[0]);
        } else {
            console.log('❌ Usuário NÃO encontrado.');
        }

    } catch (error) {
        console.error('❌ Erro de conexão:', error.message);
    } finally {
        await sequelize.close();
    }
}

verifyUser();
