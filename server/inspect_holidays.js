const sequelize = require('./config/database');

const inspect = async () => {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query("PRAGMA table_info(Holidays);");
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

inspect();
