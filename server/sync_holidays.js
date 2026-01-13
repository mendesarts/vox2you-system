require('dotenv').config();
const sequelize = require('./config/database');
const Holiday = require('./models/Holiday');

const syncHolidays = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Force sync for Holiday model to update columns
        await Holiday.sync({ alter: true });
        console.log('Holiday model synced successfully.');

        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

syncHolidays();
