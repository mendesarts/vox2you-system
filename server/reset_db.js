require('dotenv').config();
const { sequelize } = require('./models/index'); // Load models & associations

async function resetDatabase() {
    try {
        console.log("⚠️ RESETTING DATABASE (Dropping all tables)...");
        await sequelize.authenticate();

        // Force sync matches models to DB, recreating tables with new schema (Numeric IDs)
        await sequelize.sync({ force: true });

        console.log("✅ DATABASE RESET SUCCESSFUL.");
        console.log("   Now tables use INTEGER IDs.");
    } catch (error) {
        console.error("❌ DB RESET FAILED:", error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

resetDatabase();
