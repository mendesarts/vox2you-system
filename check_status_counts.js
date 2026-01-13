const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'server', 'voxflow.sqlite'),
    logging: false
});

const Lead = sequelize.define('Lead', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    status: DataTypes.TEXT,
}, { tableName: 'Leads' });

async function checkCounts() {
    try {
        await sequelize.authenticate();
        const leads = await Lead.findAll();
        const counts = {};
        leads.forEach(l => {
            counts[l.status] = (counts[l.status] || 0) + 1;
        });
        console.log('--- LEADS STATUS COUNTS IN DB ---');
        console.log(counts);
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

checkCounts();
