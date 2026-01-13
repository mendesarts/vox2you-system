const sequelize = require('../config/database');

async function checkRaw() {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query("SELECT id, createdAt, updatedAt FROM Leads ORDER BY id DESC LIMIT 10");
        console.log("Raw Results:", results);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
checkRaw();
