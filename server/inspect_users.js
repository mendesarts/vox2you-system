const sequelize = require('./config/database');

async function inspectUsers() {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query("SELECT id, name, email, role, roleId, unitId, unit FROM Users LIMIT 5");
        console.log('Users:', JSON.stringify(results, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

inspectUsers();
