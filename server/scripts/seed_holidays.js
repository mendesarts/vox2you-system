const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // Load .env from server root

const sequelize = require('../config/database');
const Holiday = require('../models/Holiday'); // Assuming this model exists

const HOLIDAYS_2025 = [
    { name: 'Confraternização Universal', date: '2025-01-01', type: 'holiday' },
    { name: 'Carnaval (Segunda)', date: '2025-03-03', type: 'recess' },
    { name: 'Carnaval (Terça)', date: '2025-03-04', type: 'recess' },
    { name: 'Quarta de Cinzas (até 14h)', date: '2025-03-05', type: 'recess' },
    { name: 'Paixão de Cristo', date: '2025-04-18', type: 'holiday' },
    { name: 'Tiradentes', date: '2025-04-21', type: 'holiday' },
    { name: 'Dia do Trabalho', date: '2025-05-01', type: 'holiday' },
    { name: 'Corpus Christi', date: '2025-06-19', type: 'holiday' },
    { name: 'Independência do Brasil', date: '2025-09-07', type: 'holiday' },
    { name: 'Nossa Sr.ª Aparecida', date: '2025-10-12', type: 'holiday' },
    { name: 'Finados', date: '2025-11-02', type: 'holiday' },
    { name: 'Proclamação da República', date: '2025-11-15', type: 'holiday' },
    { name: 'Dia da Consciência Negra', date: '2025-11-20', type: 'holiday' },
    { name: 'Natal', date: '2025-12-25', type: 'holiday' }
];

async function seedHolidays() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Get Holiday Model, assuming standard definition. If not imported correctly, define inline?
        // Let's rely on require.

        let count = 0;
        for (const h of HOLIDAYS_2025) {
            const exists = await Holiday.findOne({ where: { startDate: h.date, name: h.name } });
            if (!exists) {
                await Holiday.create({
                    name: h.name,
                    startDate: h.date,
                    endDate: h.date,
                    type: h.type
                });
                count++;
            }
        }
        console.log(`✅ Seeded ${count} holidays for 2025.`);
        process.exit(0);

    } catch (error) {
        console.error('Error seeding holidays:', error);
        process.exit(1);
    }
}

seedHolidays();
