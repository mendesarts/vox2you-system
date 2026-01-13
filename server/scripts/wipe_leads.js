const sequelize = require('../config/database');
const { Lead, Task, ContactAttempt, CadenceLog } = require('../models');

async function wipe() {
    try {
        await sequelize.authenticate();
        console.log('Deleting All Leads and related data...');

        // Delete related first (optional if cascade is set, but safer)
        await Task.destroy({ where: {}, truncate: false }); // Truncate might fail on sqlite with FK
        await ContactAttempt.destroy({ where: {}, truncate: false });
        await CadenceLog.destroy({ where: {}, truncate: false });

        // Delete Leads
        await Lead.destroy({ where: {}, truncate: false });

        console.log('✅ All leads deleted.');
    } catch (e) {
        console.error('Error wiping leads:', e);
    } finally {
        process.exit(0);
    }
}
wipe();
