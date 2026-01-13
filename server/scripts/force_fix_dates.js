const sequelize = require('../config/database');

async function forceFix() {
    try {
        await sequelize.authenticate();
        // Update all rows where createdAt is invalid string
        const now = new Date().toISOString();

        // SQLite checks
        const query = `UPDATE Leads SET createdAt = '${now}' WHERE createdAt LIKE 'Invalid%' OR createdAt IS NULL`;

        const [results, meta] = await sequelize.query(query);
        console.log('Force updated. Affected rows:', meta); // SQLite returns meta with changes?

        // Verify
        const [check] = await sequelize.query("SELECT count(*) as c FROM Leads WHERE createdAt LIKE 'Invalid%'");
        console.log("Remaining invalid:", check[0].c);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
forceFix();
