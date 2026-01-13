const sequelize = require('../config/database');
async function run() {
    try {
        await sequelize.authenticate();
        console.log('DB Config:', sequelize.options.storage);
        const [indexes] = await sequelize.query("PRAGMA index_list(Leads)");
        console.log('Indexes found:', indexes.length);
        for (const idx of indexes) {
            console.log(`Index: ${idx.name}, Unique: ${idx.unique}`);
            const [info] = await sequelize.query(`PRAGMA index_info(${idx.name})`);
            console.log('  Columns:', info.map(c => c.name));
        }
    } catch (e) {
        console.error(e);
    }
}
run();
