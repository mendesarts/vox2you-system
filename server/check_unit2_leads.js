const { Lead } = require('./models');
const { Op } = require('sequelize');

async function check() {
    try {
        const leads = await Lead.findAll({
            where: { unitId: 2 },
            paranoid: false,
            logging: false
        });

        process.stdout.write(`RESULT_START\n`);
        process.stdout.write(`Units 2 Leads Found: ${leads.length}\n`);
        leads.forEach(l => {
            process.stdout.write(`- ID: ${l.id}, Name: ${l.name}, Status: ${l.status}, Funnel: ${l.funnel}, CreatedAt: ${l.createdAt}, DeletedAt: ${l.deletedAt}\n`);
        });
        process.stdout.write(`RESULT_END\n`);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

check();
