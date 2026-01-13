const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function updateSchema() {
    try {
        // Force logging to see what's happening
        sequelize.options.logging = console.log;
        await sequelize.authenticate();
        console.log('DB Connected to:', sequelize.options.storage);

        const columnsToAdd = [
            { name: 'origin_id_importado', type: 'TEXT' },
            { name: 'sales_value', type: 'REAL' },
            { name: 'enrollment_value', type: 'REAL' },
            { name: 'payment_method', type: 'TEXT' },
            { name: 'installments', type: 'TEXT' },
            { name: 'card_brand', type: 'TEXT' },
            { name: 'media', type: 'TEXT' },
            { name: 'profession', type: 'TEXT' },
            { name: 'courseInterest', type: 'TEXT' },
            { name: 'lossReason', type: 'TEXT' }
        ];

        // Get existing columns
        const [results] = await sequelize.query("PRAGMA table_info(Leads);");
        const existingNames = results.map(c => c.name);

        console.log('Existing columns:', existingNames);

        for (const col of columnsToAdd) {
            if (!existingNames.includes(col.name)) {
                console.log(`Adding column: ${col.name}`);
                try {
                    await sequelize.query(`ALTER TABLE Leads ADD COLUMN ${col.name} ${col.type};`);
                } catch (err) {
                    console.error(`Failed to add ${col.name}:`, err.message);
                }
            } else {
                console.log(`Skipping ${col.name} (exists)`);
            }
        }

        console.log('✅ Schema Updated.');

    } catch (e) {
        console.error('Error:', e);
    }
}
updateSchema();
