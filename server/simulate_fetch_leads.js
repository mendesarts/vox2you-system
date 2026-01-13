const Lead = require('./models/Lead');
const Unit = require('./models/Unit');
const User = require('./models/User');
const Task = require('./models/Task');
const { Op } = require('sequelize');

async function simulate() {
    try {
        const roleId = 20; // Franqueado
        const unitId = 2; // Brasília.ÁguasClaras
        const id = 2; // Mendes Silva Santos

        const where = { deletedAt: null };
        if ([20, 30, 40].includes(roleId)) {
            where.unitId = unitId;
        }

        console.log('Final Where:', JSON.stringify(where));

        const leads = await Lead.findAll({
            where,
            attributes: ['id', 'name', 'status', 'funnel', 'unitId'],
            logging: false
        });

        console.log(`Found ${leads.length} leads:`);
        leads.forEach(l => {
            console.log(`- ${l.name} (${l.id}) | Status: ${l.status}, Funnel: ${l.funnel}, UnitId: ${l.unitId}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

simulate();
