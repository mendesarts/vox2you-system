const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'voxflow.sqlite'),
    logging: false
});

async function listTables() {
    try {
        const tables = await sequelize.getQueryInterface().showAllTables();
        console.log('Tables:', tables);
    } catch (error) {
        console.error('Error:', error);
    }
}

listTables();
