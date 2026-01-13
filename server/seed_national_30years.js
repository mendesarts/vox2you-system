const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({ dialect: 'sqlite', storage: 'server/voxflow.sqlite' });
const Holiday = require('./models/Holiday');
const Holidays = require('date-holidays');

(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado ao DB');
        const hd = new Holidays('BR'); // Brazil
        const currentYear = new Date().getFullYear();
        const years = 30;
        let created = 0;
        for (let y = currentYear; y < currentYear + years; y++) {
            const list = hd.getHolidays(y);
            for (const h of list) {
                // Only consider public holidays (type 'public')
                if (h.type !== 'public') continue;
                const date = h.date; // format YYYY-MM-DD
                const name = h.name;
                // Check existence
                const exists = await Holiday.findOne({ where: { startDate: date, name } });
                if (!exists) {
                    await Holiday.create({
                        name,
                        startDate: date,
                        endDate: date,
                        type: h.subtype === 'recess' ? 'recess' : 'holiday',
                        unitId: null
                    });
                    created++;
                }
            }
        }
        console.log(`✅ Inseridos ${created} feriados nacionais (30 anos).`);
    } catch (e) {
        console.error('Erro:', e);
    } finally {
        process.exit();
    }
})();
