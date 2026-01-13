require('dotenv').config();
const { sequelize } = require('./models/index');
const Holiday = require('./models/Holiday');

async function clearHolidays() {
    try {
        await sequelize.authenticate();
        console.log("🧹 Clearing Holidays...");
        await Holiday.destroy({ where: {}, truncate: true });
        console.log("✅ Holidays Table Emptied.");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

clearHolidays();
