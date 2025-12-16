const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
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

async function resetPassword() {
    try {
        await sequelize.authenticate();

        const email = 'novo.admin@voxflow.com';
        const newPassword = 'Vox2you@2025'; // Senha Simples e Garantida

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const [results] = await sequelize.query(
            "UPDATE \"Users\" SET password = :password WHERE email = :email",
            { replacements: { password: hashedPassword, email: email } }
        );

        console.log(`✅ Senha RESETADA para: ${newPassword}`);

    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await sequelize.close();
    }
}

resetPassword();
