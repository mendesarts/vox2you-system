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

async function checkUser() {
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        // Use substitution to be safe and avoid some enum issues if possible, though literal string is usually fine.
        const [results] = await sequelize.query(
            "SELECT email, role, name FROM \"Users\" WHERE email = 'novo.admin@voxflow.com'"
        );
        console.log('User novo.admin:', results);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkUser();
