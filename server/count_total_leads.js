require('dotenv').config();
const { Sequelize } = require('sequelize');
const path = require('path');

const databaseUrl = process.env.DATABASE_URL;
let sequelize;

if (databaseUrl) {
    console.log('Using DATABASE_URL from .env (Postgres/MySQL)');
    sequelize = new Sequelize(databaseUrl, {
        dialect: 'postgres',
        protocol: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });
} else {
    console.log('Using Local SQLite');
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: './voxflow.sqlite',
        logging: false
    });
}

async function countLeads() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const [results] = await sequelize.query("SELECT COUNT(*) as count FROM Leads WHERE deletedAt IS NULL");
        const [allResults] = await sequelize.query("SELECT COUNT(*) as count FROM Leads");

        console.log('--- LEADS COUNT REPORT ---');
        console.log(`Total Active Leads: ${results[0].count}`);
        console.log(`Total Database Records: ${allResults[0].count}`);

        // Count by Funnel
        try {
            const [social] = await sequelize.query("SELECT COUNT(*) as count FROM Leads WHERE deletedAt IS NULL AND funnel = 'social'");
            const [crm] = await sequelize.query("SELECT COUNT(*) as count FROM Leads WHERE deletedAt IS NULL AND funnel = 'crm'");
            const [internal] = await sequelize.query("SELECT COUNT(*) as count FROM Leads WHERE deletedAt IS NULL AND funnel = 'internal'");

            console.log(`By Funnel (Active):`);
            console.log(`  - CRM: ${crm[0].count}`);
            console.log(`  - Social: ${social[0].count}`);
            console.log(`  - Internal: ${internal[0].count}`);
        } catch (e) {
            console.log('Error counting by funnel (maybe column missing in old db version):', e.message);
        }
        console.log('--------------------------');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

countLeads();
