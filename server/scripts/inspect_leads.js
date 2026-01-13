const sequelize = require('../config/database');
const { Lead, User } = require('../models');

async function inspect() {
    try {
        sequelize.options.logging = false;
        await sequelize.authenticate(); // Ensure connection
        const leads = await Lead.findAll({
            limit: 10,
            order: [['createdAt', 'DESC']]
        });
        console.log('\n\n--- INSPECTING 10 RECENT LEADS ---');
        if (leads.length === 0) console.log("No leads found.");
        leads.forEach(l => {
            console.log(`ID: ${l.id} | Name: ${l.name} | UnitID: ${l.unitId} (${typeof l.unitId}) | RespID: ${l.consultant_id} | Status: ${l.status} | CreatedAt: ${l.createdAt}`);
        });
        console.log('---------------------------------\n');
    } catch (e) {
        console.error('Erro ao inspecionar:', e);
    } finally {
        // Force exit because sequelize connection might hang
        process.exit(0);
    }
}
inspect();
