const sequelize = require('../server/config/database');
const { DataTypes } = require('sequelize');

const migrate = async () => {
    try {
        console.log('Starting Lead Model Migration...');
        const queryInterface = sequelize.getQueryInterface();
        const table = 'Leads';

        const columns = [
            { name: 'cpf', type: DataTypes.STRING },
            { name: 'rg', type: DataTypes.STRING },
            { name: 'birthDate', type: DataTypes.DATEONLY },
            { name: 'profession', type: DataTypes.STRING },
            { name: 'address', type: DataTypes.STRING },
            { name: 'courseInterest', type: DataTypes.STRING },
            { name: 'lossReason', type: DataTypes.STRING },
            { name: 'tracking', type: DataTypes.TEXT, defaultValue: '{}' },
            { name: 'metadata', type: DataTypes.TEXT, defaultValue: '{}' }
        ];

        for (const col of columns) {
            try {
                await queryInterface.addColumn(table, col.name, {
                    type: col.type,
                    defaultValue: col.defaultValue
                });
                console.log(`Added column: ${col.name}`);
            } catch (e) {
                if (e.message.includes('duplicate column name')) {
                    console.log(`Column ${col.name} already exists.`);
                } else {
                    console.error(`Error adding ${col.name}:`, e.message);
                }
            }
        }

        console.log('Migration complete.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
};

migrate();
