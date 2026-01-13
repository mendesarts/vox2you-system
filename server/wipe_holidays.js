require('dotenv').config();
const sequelize = require('./config/database');
const Holiday = require('./models/Holiday');

const wipeHolidays = async () => {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        // Delete ALL
        await Holiday.destroy({ where: {}, truncate: true });
        console.log('All holidays deleted.');

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

wipeHolidays();
