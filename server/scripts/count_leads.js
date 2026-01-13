const sequelize = require('../config/database');
const { Lead } = require('../models');

async function count() {
    try {
        await sequelize.authenticate(); // Ensure connection
        const count = await Lead.count();
        console.log(`\n\n------- RESULTADO -------\nTOTAL LEADS: ${count}\n-------------------------\n`);
    } catch (e) {
        console.error('Erro ao contar:', e);
    } finally {
        // Force exit because sequelize connection might hang
        process.exit(0);
    }
}
count();
