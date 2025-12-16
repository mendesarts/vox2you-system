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

async function checkUserRoles() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');

        const [results, metadata] = await sequelize.query(
            "SELECT email, role, name FROM \"Users\" WHERE email = 'novo.admin@voxflow.com' OR role = 'master'"
        );

        console.log('Identified Users:', JSON.stringify(results, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkUserRoles();
