const sequelize = require('./config/database');

async function inspectUnits() {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query("SELECT * FROM Units");
        console.log('Units:', JSON.stringify(results, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

inspectUnits();
