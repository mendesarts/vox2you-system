const User = require('./models/User');
const sequelize = require('./config/database');

async function listUsers() {
    try {
        await sequelize.authenticate();
        console.log('Connection established.');

        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'roleId']
        });

        console.log('--- ALL USERS ---');
        users.forEach(u => {
            console.log(`[${u.id}] ${u.name} (${u.email}) - Role: ${u.role}, RoleID: ${u.roleId}`);
        });

    } catch (error) {
        console.error('Unable to connect:', error);
    } finally {
        await sequelize.close();
    }
}

listUsers();
