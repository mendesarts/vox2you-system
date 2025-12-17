const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    logging: false
});

async function checkHash() {
    try {
        await sequelize.authenticate();
        const email = 'novo.admin@voxflow.com';
        const [users] = await sequelize.query(
            "SELECT password FROM \"Users\" WHERE email = :email",
            { replacements: { email } }
        );

        if (users.length > 0) {
            console.log('Hash Atual:', users[0].password);

            // Comparar com o Hash conhecido da senha padrão (Vox2you@2025)
            // Hash antigo: $2b$10$CtbmFikv8WpIdXfGykpAruF42T9PTLssvctUJDAzxDpefAyYdj3Ni
            const oldHash = '$2b$10$CtbmFikv8WpIdXfGykpAruF42T9PTLssvctUJDAzxDpefAyYdj3Ni';

            if (users[0].password === oldHash) {
                console.log('⚠️ A SENHA NÃO MUDOU! O banco ainda tem a senha padrão (Vox2you@2025).');
                console.log('Provável causa: O update anterior ocorreu antes do deploy da correção de modelo terminar.');
            } else {
                console.log('✅ A senha MUDOU no banco.');
            }
        }
    } catch (e) { console.error(e); } finally { await sequelize.close(); }
}

checkHash();
