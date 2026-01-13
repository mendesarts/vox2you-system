const User = require('./models/User');
const sequelize = require('./config/database');

async function listUsersExtra() {
    try {
        await sequelize.authenticate();
        console.log('Connection established.');

        // User model def usually doesn't have 'unit' string unless added dynamically or in model file.
        // But the DB might have it.
        const [results] = await sequelize.query("SELECT id, name, email, unitId, unit FROM Users");

        console.log('--- USERS RAW DATA ---');
        console.table(results);

    } catch (error) {
        console.error('Unable to connect:', error);
    } finally {
        await sequelize.close();
    }
}

listUsersExtra();
