const { sequelize } = require('../models');

async function syncDb() {
    try {
        console.log('Starting DB Sync (alter: true)...');
        await sequelize.sync({ alter: true });
        console.log('✅ DB Sync completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ DB Sync failed:', error);
        process.exit(1);
    }
}

syncDb();
