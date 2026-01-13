require('dotenv').config();
const { sequelize } = require('./models/index');
const Holiday = require('./models/Holiday');

async function checkHolidays() {
    try {
        await sequelize.authenticate();
        console.log("🔍 Checking Holidays...");

        const holidays = await Holiday.findAll();

        if (holidays.length === 0) {
            console.log("Result: 0 holidays found.");
        } else {
            console.log(`Result: ${holidays.length} holidays found.`);
            holidays.forEach(h => {
                console.log(` - [${h.id}] ${h.name} (${h.date || h.startDate}) - Unit: ${h.unitId}`);
            });
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

checkHolidays();
