const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'server/voxflow.sqlite'),
    logging: console.log
});

const queryInterface = sequelize.getQueryInterface();

async function addDeletedAt() {
    console.log('🛡️ Adicionando suporte a Exclusão Segura...');
    try {
        const table = 'Leads';
        const cols = await queryInterface.describeTable(table);

        if (!cols.deletedAt) {
            await queryInterface.addColumn(table, 'deletedAt', {
                type: DataTypes.DATE,
                allowNull: true
            });
            console.log('✅ Coluna deletedAt adicionada.');
        } else {
            console.log('ℹ️ Coluna deletedAt já existe.');
        }
    } catch (e) {
        console.error('Erro:', e.message);
    }
}

addDeletedAt();
