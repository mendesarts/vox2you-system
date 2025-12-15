const { Sequelize } = require('sequelize');
const path = require('path');

// Use DATABASE_URL if present (Production/GCP), otherwise local SQLite
const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

let sequelize;

if (databaseUrl) {
    // PostgreSQL (GCP Cloud SQL)
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
    // Local Development (SQLite)
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '..', 'voxflow.sqlite'),
        logging: false
    });
}

module.exports = sequelize;
