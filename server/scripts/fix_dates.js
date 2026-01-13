const { Lead } = require('../models');
const sequelize = require('../config/database');

async function fixDates() {
    try {
        await sequelize.authenticate();
        const leads = await Lead.findAll();
        console.log(`Checking ${leads.length} leads for date issues...`);
        let fixed = 0;

        for (const lead of leads) {
            const c = new Date(lead.createdAt);
            const u = new Date(lead.updatedAt);
            let needsUpdate = false;
            let updates = {};

            if (isNaN(c.getTime())) {
                updates.createdAt = new Date();
                needsUpdate = true;
            }
            if (isNaN(u.getTime())) {
                updates.updatedAt = new Date();
                needsUpdate = true;
            }

            if (needsUpdate) {
                // console.log(`Fixing lead ${lead.id}...`);
                await lead.update(updates);
                fixed++;
            }
        }
        console.log(`Fixed dates for ${fixed} leads.`);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
fixDates();
