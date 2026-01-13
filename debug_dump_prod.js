require('dotenv').config({ path: './server/.env' });
const sequelize = require('./server/config/database');
const Class = require('./server/models/Class');
const User = require('./server/models/User');

async function dump() {
    try {
        await sequelize.authenticate();
        console.log('--- CONNECTED TO: ' + (process.env.DATABASE_URL ? 'POSTGRES' : 'SQLITE') + ' ---');

        console.log('--- CLASS DUMP (Latest 5) ---');
        const classes = await Class.findAll({
            limit: 5,
            order: [['createdAt', 'DESC']],
            attributes: ['id', 'name', 'unitId', 'professorId', 'status']
        });
        console.log(JSON.stringify(classes, null, 2));

        console.log('--- USER DUMP (Franchisee/Pedagogical) ---');
        const users = await User.findAll({
            where: { roleId: [20, 50, 51] },
            limit: 10,
            attributes: ['id', 'name', 'roleId', 'unitId']
        });
        console.log(JSON.stringify(users, null, 2));

    } catch (error) {
        console.error(error);
    } finally {
        // process.exit(0);
    }
}

dump();
