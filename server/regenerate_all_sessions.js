const { Sequelize } = require('sequelize');
const path = require('path');
const Class = require('./models/Class');
const Course = require('./models/Course');
const Module = require('./models/Module');
const ClassSession = require('./models/ClassSession');
const Holiday = require('./models/Holiday');
const { generateScheduleForClass } = require('./utils/scheduleGenerator');

// Initialize DB (needed if models don't auto-connect, which they usually do via config/database)
// But I need to wait for connection.
const sequelize = require('./config/database');

async function regenerateAll() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const classes = await Class.findAll();
        console.log(`Found ${classes.length} classes.`);

        for (const cls of classes) {
            console.log(`Processing Class: ${cls.name} (${cls.id})`);
            try {
                const result = await generateScheduleForClass(cls.id);
                console.log(`  -> Success! Generated/Updated ${result.count} sessions. EndDate: ${result.endDate}`);
            } catch (err) {
                console.error(`  -> Failed: ${err.message}`);
                // Continue with next class
            }
        }

        console.log('Done.');
        process.exit(0);
    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
}

regenerateAll();
