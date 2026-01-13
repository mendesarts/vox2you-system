const { Unit, User } = require('./models');

async function check() {
    try {
        const units = await Unit.findAll();
        console.log('Units:', JSON.stringify(units.map(u => ({ id: u.id, name: u.name })), null, 2));

        const users = await User.findAll({ limit: 10 });
        console.log('Users sample:', JSON.stringify(users.map(u => ({ id: u.id, name: u.name, unitId: u.unitId, roleId: u.roleId })), null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

check();
