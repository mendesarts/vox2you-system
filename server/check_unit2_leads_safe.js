const { Lead } = require('./models');
const { Op } = require('sequelize');

async function check() {
    try {
        const leads = await Lead.findAll({
            where: { unitId: 2 },
            attributes: ['id', 'name', 'status', 'funnel', 'createdAt', 'unitId', 'deletedAt'],
            paranoid: false,
            logging: false
        });

        console.log(`Units 2 Leads Found: ${leads.length}`);
        leads.forEach(l => {
            console.log(`- ID: ${l.id}, Name: ${l.name}, Status: ${l.status}, Funnel: ${l.funnel}, CreatedAt: ${l.createdAt}, DeletedAt: ${l.deletedAt}`);
        });
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

check();
