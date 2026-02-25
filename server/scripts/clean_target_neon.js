const { Sequelize } = require('sequelize');

// TARGET: NEON DB
const NEON_URL = "postgresql://neondb_owner:npg_Z0nhGM3LBOjQ@ep-withered-mountain-ahhvk6ww-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function run() {
    const targetDB = new Sequelize(NEON_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        logging: false,
        dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
    });
    
    try {
        await targetDB.authenticate();
        console.log("Connected to Neon DB. Dropping all tables...");
        await targetDB.getQueryInterface().dropAllTables();
        console.log("Tables dropped.");
    } catch(err) {
        console.error("Error:", err);
    } finally {
        await targetDB.close();
    }
}
run();
