require('dotenv').config();
const User = require('./models/User');
const sequelize = require('./config/database');

async function dump() {
    try {
        console.log('--- DATABASE CONFIG ---');
        console.log('Dialect:', sequelize.getDialect());

        const users = await User.findAll({
            attributes: ['id', 'name', 'canMentorship', 'roleId'],
            raw: true
        });
        console.log('--- USERS IN DB ---');
        console.table(users);

        const [mentorships] = await sequelize.query('SELECT "id", "studentId", "mentorId", "status" FROM "Mentorships" LIMIT 5');
        console.log('--- MENTORSHIPS SAMPLE ---');
        console.table(mentorships);

    } catch (e) {
        console.error('FAILED:', e);
    } finally {
        process.exit();
    }
}

dump();
