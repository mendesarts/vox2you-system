const sequelize = require('./config/database');

async function fixLeads() {
    try {
        await sequelize.authenticate();
        console.log('Adding deletedAt to Leads if missing...');

        // Check if column exists
        const [columns] = await sequelize.query("PRAGMA table_info(Leads);");
        const hasDeletedAt = columns.some(c => c.name === 'deletedAt');

        if (!hasDeletedAt) {
            await sequelize.query("ALTER TABLE Leads ADD COLUMN deletedAt DATETIME;");
            console.log('Added deletedAt column to Leads.');
        } else {
            console.log('deletedAt already exists in Leads.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

fixLeads();
