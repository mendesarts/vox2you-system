const sequelize = require('../config/database');
async function run() {
    try {
        await sequelize.authenticate();
        console.log('Dropping old global index...');
        try {
            await sequelize.query("DROP INDEX IF EXISTS leads_origin_id_importado_unique");
        } catch (e) { console.log('Old index might not exist or verify name:', e.message); }

        console.log('Creating new composite index (origin_id_importado + unitId)...');
        await sequelize.query("CREATE UNIQUE INDEX IF NOT EXISTS leads_origin_unit_unique ON Leads (origin_id_importado, unitId) WHERE origin_id_importado IS NOT NULL");

        console.log('Indexes Updated Successfully.');
    } catch (e) {
        console.error('Index Update Failed:', e);
    }
}
run();
