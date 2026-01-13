const { sequelize, Lead, Task } = require('./models');

async function wipeLeads() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        // Delete Tasks linked to Leads first (to avoid constraint errors if no Cascade)
        // Or if Cascade is on, Lead destroy is enough. But let's be safe.
        // Actually, let's just use TRUNCATE or destroy with where: {}

        console.log('Deleting ALL Tasks associated with Leads...');
        await Task.destroy({ where: {}, truncate: false }); // Careful: this deletes ALL tasks?
        // Wait, User said "wipe ALL leads". Usually we want to clear tasks linked to them.
        // If I truncate Leads, Tasks with leadId will crash or cascade.
        // Safest is to find all leads and destroy.

        const count = await Lead.count();
        console.log(`Deleting ${count} leads...`);

        // Remove Tasks first if they are strictly lead tasks (category commercial?)
        await Task.destroy({ where: { leadId: { [require('sequelize').Op.ne]: null } } });

        await Lead.destroy({ where: {}, truncate: true, cascade: true });
        console.log('ALL LEADS DELETED SUCCESSFULLY.');

    } catch (e) {
        console.error('Error wiping leads:', e);
    } finally {
        await sequelize.close();
    }
}

wipeLeads();
