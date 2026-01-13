const { User } = require('./server/models');
async function test() {
    try {
        const users = await User.findAll({ attributes: ['id', 'email', 'role', 'roleId'] });
        console.log('USERS_START');
        console.log(JSON.stringify(users, null, 2));
        console.log('USERS_END');
    } catch (e) {
        console.error('DB_ERROR', e);
    } finally {
        process.exit();
    }
}
test();
