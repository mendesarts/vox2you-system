require('dotenv').config();
const { sequelize } = require('./models/index');
const Holiday = require('./models/Holiday');

// Calculate Easter Sunday (Meeus/Jones/Butcher)
function getEaster(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
}

function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

async function seed30Years() {
    try {
        await sequelize.authenticate();
        console.log("📅 Generating Holidays for 30 Years...");

        // Ensure clean slate before adding
        console.log("   (Truncating Holidays table...)");
        await sequelize.query('TRUNCATE TABLE "Holidays" RESTART IDENTITY CASCADE;');

        const startYear = new Date().getFullYear();
        const endYear = startYear + 30;
        const holidaysToCreate = [];

        for (let y = startYear; y <= endYear; y++) {
            // Fixed
            holidaysToCreate.push({ name: 'Confraternização Universal', date: `${y}-01-01` });
            holidaysToCreate.push({ name: 'Tiradentes', date: `${y}-04-21` });
            holidaysToCreate.push({ name: 'Dia do Trabalho', date: `${y}-05-01` });
            holidaysToCreate.push({ name: 'Independência do Brasil', date: `${y}-09-07` });
            holidaysToCreate.push({ name: 'Nossa Senhora Aparecida', date: `${y}-10-12` });
            holidaysToCreate.push({ name: 'Finados', date: `${y}-11-02` });
            holidaysToCreate.push({ name: 'Proclamação da República', date: `${y}-11-15` });
            holidaysToCreate.push({ name: 'Natal', date: `${y}-12-25` });

            // Movable
            const easter = getEaster(y);
            const carnaval = addDays(easter, -47);
            const paizao = addDays(easter, -2); // Sexta-feira Santa
            const corpus = addDays(easter, 60);

            holidaysToCreate.push({ name: 'Carnaval', date: formatDate(carnaval) });
            holidaysToCreate.push({ name: 'Paixão de Cristo', date: formatDate(paizao) });
            holidaysToCreate.push({ name: 'Corpus Christi', date: formatDate(corpus) });
        }

        console.log(`Prepared ${holidaysToCreate.length} holidays.`);

        // Batch Insert
        const records = holidaysToCreate.map(h => ({
            name: h.name,
            startDate: h.date,
            endDate: h.date,
            type: 'holiday',
            unitId: null // Global
        }));

        await Holiday.bulkCreate(records);
        console.log("✅ Success! Holidays inserted.");

    } catch (e) {
        console.error("Error:", e);
        require('fs').writeFileSync('seed_holidays_error.log', e.toString());
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

seed30Years();
