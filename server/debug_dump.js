const sequelize = require('./config/database');
const User = require('./models/User');

async function dump() {
    try {
        await sequelize.authenticate();
        console.log('--- USER DUMP Limit 50 ---');
        const users = await User.findAll({ limit: 50, attributes: ['id', 'name', 'roleId'] });
        console.log(JSON.stringify(users, null, 2));

        const targetId = 'df74c7c6-2f59-499a-9fc6-6756e80008b7'; // From Class Dump
        const prof = await User.findByPk(targetId);
        console.log('--- PROFESSOR CHECK ---');
        console.log(prof ? 'Professor Found: ' + prof.name : 'Professor NOT FOUND');

    } catch (error) {
        console.error(error);
    } finally {
        process.exit(0);
    }
}

dump();
