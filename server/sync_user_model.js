const { Sequelize } = require('sequelize');
const User = require('./models/User');
require('dotenv').config();

const sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
        logging: console.log
    })
    : new Sequelize({
        dialect: 'sqlite',
        storage: 'voxflow.sqlite',
        logging: console.log
    });

// Attach model to this instance provided here for the script (hacky but works for quick sync)
User.init(User.rawAttributes, { sequelize, modelName: 'User' });

async function syncUser() {
    try {
        await sequelize.authenticate();
        console.log('Syncing User model...');
        await User.sync({ alter: true });
        console.log('User model synced successfully.');
    } catch (error) {
        console.error('Error syncing User model:', error);
    } finally {
        await sequelize.close();
    }
}

syncUser();
