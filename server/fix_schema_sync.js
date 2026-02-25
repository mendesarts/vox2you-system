const sequelize = require('./config/database');
const Lead = require('./models/Lead');
// Load other models if necessary, but sequelize.sync() usually syncs all defined models
require('./models'); // This should load all models and associations

async function fixSchema() {
    try {
        console.log('Synchronizing database schema...');
        await sequelize.authenticate();
        console.log('Database connected.');

        // This will add missing columns like deletedAt
        await sequelize.sync({ alter: true });
        console.log('Schema synchronization complete.');
    } catch (error) {
        console.error('Schema synchronization failed:', error);
    } finally {
        await sequelize.close();
    }
}

fixSchema();
