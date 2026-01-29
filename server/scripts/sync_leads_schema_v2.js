const { Lead } = require('../models');
const sequelize = require('../config/database');

async function run() {
    try {
        const dialect = sequelize.getDialect();
        console.log(`🔌 Connected to ${dialect}`);

        if (dialect !== 'postgres') {
            console.error("❌ ABORTING: Not connected to Postgres! (Current: " + dialect + ")");
            return;
        }

        console.log("🔄 Syncing Lead table (ALTER)...");
        await Lead.sync({ alter: true });
        console.log("✅ Lead Schema Synced!");
    } catch (error) {
        console.error("❌ Error syncing:", error);
    } finally {
        await sequelize.close();
    }
}

run();
