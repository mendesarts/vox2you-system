const { sequelize } = require('../models');
const { DataTypes } = require('sequelize');

async function migrateLeads() {
    console.log('🚀 Starting Manual Migration for Leads table...');
    const queryInterface = sequelize.getQueryInterface();
    const tableInfo = await queryInterface.describeTable('Leads');

    const columnsToAdd = [
        { name: 'sdr_id', type: DataTypes.INTEGER },
        { name: 'quantity', type: DataTypes.INTEGER },
        { name: 'secondary_phone', type: DataTypes.STRING },
        { name: 'secondary_email', type: DataTypes.STRING },
        { name: 'position', type: DataTypes.STRING },
        { name: 'cnpj', type: DataTypes.STRING },
        { name: 'organization_id', type: DataTypes.STRING },
        { name: 'bank_code', type: DataTypes.STRING },
        { name: 'real_address', type: DataTypes.STRING },
        { name: 'connection_done', type: DataTypes.BOOLEAN, defaultValue: false },
        { name: 'connection_date', type: DataTypes.DATE },
        { name: 'connection_channel', type: DataTypes.STRING },
        { name: 'enrollmentDate', type: DataTypes.DATE },
        { name: 'material_value', type: DataTypes.FLOAT }
    ];

    for (const col of columnsToAdd) {
        if (!tableInfo[col.name]) {
            try {
                console.log(`➕ Adding column: ${col.name}`);
                await queryInterface.addColumn('Leads', col.name, {
                    type: col.type,
                    allowNull: true,
                    defaultValue: col.defaultValue !== undefined ? col.defaultValue : null
                });
                console.log(`✅ Column ${col.name} added.`);
            } catch (err) {
                console.error(`❌ Error adding column ${col.name}:`, err.message);
            }
        } else {
            console.log(`ℹ️ Column ${col.name} already exists.`);
        }
    }

    console.log('🏁 Migration finished!');
    process.exit(0);
}

migrateLeads();
