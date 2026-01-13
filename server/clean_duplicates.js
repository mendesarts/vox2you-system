require('dotenv').config();
const sequelize = require('./config/database');
const Holiday = require('./models/Holiday');
const { Op } = require('sequelize');

const cleanDuplicates = async () => {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        const holidays = await Holiday.findAll({
            order: [['createdAt', 'DESC']] // Keep newest? Or oldest? Maybe keep oldest.
        });

        const seen = new Set();
        let deleted = 0;

        for (const h of holidays) {
            const key = `${h.name}-${h.startDate}-${h.unitId}`;
            if (seen.has(key)) {
                console.log(`Deleting duplicate: ${h.name} (${h.startDate})`);
                await h.destroy();
                deleted++;
            } else {
                seen.add(key);
            }
        }

        console.log(`Cleaned ${deleted} duplicates.`);
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

cleanDuplicates();
