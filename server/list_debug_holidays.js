require('dotenv').config();
const sequelize = require('./config/database');
const Holiday = require('./models/Holiday');

const listHolidays = async () => {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        const holidays = await Holiday.findAll({
            order: [['startDate', 'ASC'], ['name', 'ASC']]
        });

        console.log(`count: ${holidays.length}`);
        holidays.forEach(h => {
            console.log(`${h.startDate} - ${h.name} [${h.id}] Unit:${h.unitId}`);
        });

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

listHolidays();
