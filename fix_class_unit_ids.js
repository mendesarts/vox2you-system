
const { Sequelize, Op } = require('sequelize');
const path = require('path');
const Class = require('./server/models/Class');

// Init DB
const sequelize = require('./server/config/database');

// Hash Logic
const getNumericId = (id) => {
    if (!id) return null;
    if (!isNaN(Number(id))) return Number(id);
    let hash = 0;
    const str = String(id);
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
    return Math.abs(hash);
};

async function fix() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        const classes = await Class.findAll();
        console.log(`Found ${classes.length} classes.`);

        let updated = 0;
        for (const cls of classes) {
            const rawUnitId = cls.unitId;
            // Check if it looks like a String/UUID that isn't just digits
            // Note: cls.unitId might be returned as number by Sequelize if it thinks it's a number, 
            // but if SQLite stored '4ee7...', Sequelize might return it as String or NaN?
            // Since model defines INTEGER, Sequelize tries to cast. 
            // If it stored '4ee7...', fetching might result in '4' or NaN?

            // Actually, best way is to check the record raw data via raw query if possible, 
            // but let's assume if it is valid integer (hash) it is large (8133...).
            // If it is small, it might be an ID.
            // If we have access to the original UUID via some other means? 
            // We don't know the UUID unless we infer it from user?

            // Wait, if the class was created with `req.user.unitId` (UUID), it was stored as string in SQLite.
            // If we read it back, depending on driver, we might get the string.

            // Let's force raw query to see strings.
        }

        const [results] = await sequelize.query("SELECT id, unitId FROM Classes");

        for (const row of results) {
            const val = row.unitId;
            if (typeof val === 'string' && val.length > 10 && val.includes('-')) {
                // It is a UUID
                const hashed = getNumericId(val);
                console.log(`Fixing Class ${row.id}: ${val} -> ${hashed}`);
                await sequelize.query(`UPDATE Classes SET unitId = ${hashed} WHERE id = ${row.id}`);
                updated++;
            }
        }

        console.log(`Updated ${updated} classes.`);
        process.exit(0);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

fix();
