const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Configure Sequelize manually since we want to run this standalone
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'voxflow.sqlite'),
    logging: console.log
});

async function addMetadataColumn() {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('Students');

        if (!tableInfo.metadata) {
            console.log('Adding metadata column to Students table...');
            await queryInterface.addColumn('Students', 'metadata', {
                type: DataTypes.TEXT,
                allowNull: true
            });
            console.log('Column added successfully.');
        } else {
            console.log('Metadata column already exists.');
        }
    } catch (error) {
        console.error('Error adding column:', error);
    }
}

addMetadataColumn();
