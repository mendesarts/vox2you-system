const sequelize = require('./config/database');

async function checkLeadsPerUnit() {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query("SELECT unitId, COUNT(*) as count FROM Leads GROUP BY unitId");
        console.log('Leads per Unit:', JSON.stringify(results, null, 2));

        const [total] = await sequelize.query("SELECT COUNT(*) as count FROM Leads");
        console.log('Total Leads:', total[0].count);

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

checkLeadsPerUnit();
