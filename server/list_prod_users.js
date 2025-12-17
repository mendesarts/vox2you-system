const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    logging: false
});

async function listUsers() {
    try {
        await sequelize.authenticate();
        const [users] = await sequelize.query(
            "SELECT id, name, email, role, active, \"createdAt\" FROM \"Users\" ORDER BY \"createdAt\" DESC"
        );
        console.table(users);
    } catch (e) { console.error(e); } finally { await sequelize.close(); }
}

listUsers();
