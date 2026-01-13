const sequelize = require('../config/database');

async function fix() {
    try {
        await sequelize.authenticate();
        console.log('Checking columns...');

        const cols = [
            { name: 'address', type: 'VARCHAR(255)' },
            { name: 'state', type: 'VARCHAR(100)' },
            { name: 'cep', type: 'VARCHAR(20)' },
            { name: 'cpf', type: 'VARCHAR(20)' },
            { name: 'rg', type: 'VARCHAR(20)' },
            { name: 'birthDate', type: 'DATE' },
            { name: 'city', type: 'VARCHAR(255)' }, // ensure check
            { name: 'neighborhood', type: 'VARCHAR(255)' } // ensure check
        ];

        for (const col of cols) {
            try {
                // Try selecting to see if exists
                await sequelize.query(`SELECT ${col.name} FROM Leads LIMIT 1`);
                console.log(`✅ ${col.name} exists.`);
            } catch (err) {
                console.log(`➕ Adding column: ${col.name}`);
                try {
                    await sequelize.query(`ALTER TABLE Leads ADD COLUMN ${col.name} ${col.type}`);
                    console.log(`✅ Added ${col.name}`);
                } catch (addErr) {
                    console.error(`❌ Failed to add ${col.name}:`, addErr.message);
                }
            }
        }

    } catch (e) {
        console.error('Fatal:', e);
    } finally {
        process.exit(0);
    }
}
fix();
