const { Sequelize, DataTypes } = require('sequelize');
const LeadModelDef = require('../models/Lead'); // Function or Class? checking Lead.js export

// TARGET: NEON DB
const NEON_URL = "postgresql://neondb_owner:npg_Z0nhGM3LBOjQ@ep-withered-mountain-ahhvk6ww-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

const sequelize = new Sequelize(NEON_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: console.log, // Log SQL to see ALTERS
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

async function syncLead() {
    console.log("🔄 Synchronizing Lead Schema...");

    // Define Lead model on this instance
    // Lead.js exports a class/model definition.
    // It requires 'sequelize' instance.
    // But Lead.js does: const Lead = sequelize.define(...) using '../config/database'.
    // We need to bypass the default instance in Lead.js or mock it.

    // Actually, simpler way: Use the 'index.js' logic but only for Lead?
    // Or just define it here to be sure.

    // To match exact definition, better to copy-paste the definition or require it if it takes an instance.
    // Lead.js uses `require('../config/database')`. If we run this script, it will use the SQLite one from config!
    // UNLESS we set DATABASE_URL env var before running.

    // So the strategy is:
    // 1. Set DATABASE_URL env var to Neon.
    // 2. Run a script that requires models and calls sync() on Lead.

    console.log("Please run this with DATABASE_URL set.");
}

// We will use a different approach:
// Create a temporary script that sets process.env.DATABASE_URL then requires the models.

process.env.DATABASE_URL = NEON_URL;
process.env.NODE_ENV = 'production';

// Now require models (which will use the env var to connect to Neon)
const { Lead } = require('../models');

async function run() {
    try {
        console.log("🔌 Connected. Syncing Lead table (ALTER)...");
        await Lead.sync({ alter: true });
        console.log("✅ Lead Schema Synced!");
    } catch (error) {
        console.error("❌ Error syncing:", error);
    } finally {
        // Need to close the connection from the models instance
        const db = require('../config/database');
        await db.close();
    }
}

run();
