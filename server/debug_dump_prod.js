require('dotenv').config();
const { sequelize } = require('./models/index'); // Correct way to load with associations
const Course = require('./models/Course');
const Module = require('./models/Module');

async function dump() {
    try {
        await sequelize.authenticate();
        console.log('--- COURSE DUMP ---');
        const courses = await Course.findAll({
            include: [{ model: Module, attributes: ['id', 'title'] }]
        });

        courses.forEach(c => {
            console.log(`Course: ${c.name} (ID: ${c.id}) - Modules: ${c.Modules.length}`);
            if (c.Modules.length === 0) console.log('  [WARNING] NO MODULES');
            else c.Modules.forEach(m => console.log(`  - ${m.title}`));
        });

    } catch (error) {
        console.error(error);
    } finally {
        process.exit(0);
    }
}

dump();
