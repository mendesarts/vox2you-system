const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sequelize = require('../config/database');
const User = require('../models/User');
const Unit = require('../models/Unit');
const bcrypt = require('bcryptjs');

async function reset() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        // Sync Schema to ensure new columns exist (canMentorship, workingHours)
        console.log('Syncing Schema...');
        await sequelize.sync({ alter: true });

        // Optional: Create/Ensure Matriz Unit exists
        let matriz = await Unit.findOne({ where: { name: 'Matriz' } });
        if (!matriz) {
            console.log('Creating Matriz Unit...');
            matriz = await Unit.create({ name: 'Matriz', city: 'São Paulo', active: true });
        }

        console.log('Deleting All Users...');
        // Using truncate to clear table quickly. Be careful with FK constraints.
        // If failing due to constraints, we might need to delete individually.
        try {
            await User.destroy({ where: {}, truncate: true, cascade: true });
        } catch (err) {
            console.log('Truncate failed (probably FKs), trying standard delete...');
            await User.destroy({ where: {} });
        }

        console.log('Creating New Master...');
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('M@ster1512', salt);

        const master = await User.create({
            name: 'Master VoxFlow',
            email: 'master@voxflow.com.br',
            password: hash,
            role: 'master',
            roleId: 1,
            unit: 'Matriz',
            unitId: matriz.id,
            active: true,
            forcePasswordChange: false // Master doesn't need to change immediately
        });

        console.log('Master Created:', master.email);
        console.log('Done.');
        process.exit(0);

    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

reset();
