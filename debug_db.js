
const fs = require('fs');
const log = (msg) => fs.appendFileSync('debug_output.txt', msg + '\n');
console.log = log;
console.error = log;
log("Starting script...");
const { Sequelize } = require('sequelize');
const path = require('path');
const dbConfig = require('./server/config/database.js'); // Assuming this exports sequelize instance

// If config exports just config, we need to init sequelize. 
// Looking at models, they import sequelize from '../config/database'.

const sequelize = require('./server/config/database');
const Class = require('./server/models/Class');
const ClassSession = require('./server/models/ClassSession');
const Holiday = require('./server/models/Holiday');
const User = require('./server/models/User');

async function check() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const userCount = await User.count();
        console.log(`Users: ${userCount}`);

        const classCount = await Class.count();
        console.log(`Classes: ${classCount}`);

        const sessionCount = await ClassSession.count();
        console.log(`ClassSessions: ${sessionCount}`);

        const holidayCount = await Holiday.count();
        console.log(`Holidays: ${holidayCount}`);

        if (sessionCount > 0) {
            const firstSession = await ClassSession.findOne();
            console.log('First Session:', JSON.stringify(firstSession, null, 2));
        } else {
            console.log('No sessions found. Attempting to list Classes to see if we can generate.');
            const classes = await Class.findAll({ limit: 2 });
            console.log('Classes:', JSON.stringify(classes, null, 2));
        }

        if (holidayCount > 0) {
            const firstHoliday = await Holiday.findOne();
            console.log('First Holiday:', JSON.stringify(firstHoliday, null, 2));
        }

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

check();
