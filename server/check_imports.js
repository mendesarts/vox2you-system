const { sequelize, Lead } = require('./models');
const { Op } = require('sequelize');

async function checkImported() {
    try {
        await sequelize.authenticate();
        // Check for leads created recently (last 2 hours) or with 'Importado' tag
        const leads = await Lead.findAll({
            where: {
                [Op.or]: [
                    { tags: { [Op.like]: '%Importado%' } },
                    { createdAt: { [Op.gt]: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Last 24h
                ]
            }
        });

        console.log(`Found ${leads.length} recent/imported leads.`);
        leads.forEach(l => {
            console.log(`- ID: ${l.id} | Name: ${l.name} | Phone: ${l.phone} | Source: ${l.source} | Created: ${l.createdAt}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

checkImported();
