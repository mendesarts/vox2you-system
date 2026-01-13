const { Lead } = require('../models');

async function testFetch() {
    try {
        console.log('Fetching leads from DB...');
        const leads = await Lead.findAll({ limit: 5 });
        console.log(`Leads found: ${leads.length}`);
        leads.forEach(l => {
            console.log(`- ${l.name} (Status: ${l.status}, Unit: ${l.unitId})`);
        });
        process.exit(0);
    } catch (error) {
        console.error('Error fetching leads:', error);
        process.exit(1);
    }
}

testFetch();
