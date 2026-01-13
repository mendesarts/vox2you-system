const User = require('./models/User');
const sequelize = require('./config/database');

async function listUsersVerbose() {
    try {
        await sequelize.authenticate();
        console.log('Connection established.');

        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'roleId', 'unitId']
        });

        console.log('--- ALL USERS (Detailed) ---');
        users.forEach(u => {
            console.log(`[${u.id}] ${u.name} (${u.email}) - Role: ${u.role}, UnitID: ${u.unitId}`);
        });

    } catch (error) {
        console.error('Unable to connect:', error);
    } finally {
        await sequelize.close();
    }
}

listUsersVerbose();
