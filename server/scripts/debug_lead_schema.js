const { Sequelize } = require('sequelize');

const NEON_URL = "postgresql://neondb_owner:npg_Z0nhGM3LBOjQ@ep-withered-mountain-ahhvk6ww-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

const sequelize = new Sequelize(NEON_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

async function checkSchema() {
    try {
        await sequelize.authenticate();
        console.log("Connected to Neon.");

        const [results] = await sequelize.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Leads';
        `);

        console.log("Columns in Leads table:");
        console.dir(results.map(r => r.column_name).sort(), { maxArrayLength: null });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await sequelize.close();
    }
}

checkSchema();
