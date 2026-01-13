const { Sequelize } = require('sequelize');
const sequelize = new Sequelize({ dialect: 'sqlite', storage: 'server/voxflow.sqlite' });
const Class = require('./models/Class');
const ClassSession = require('./models/ClassSession');
const { Op } = require('sequelize');

(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado ao DB');
        const classes = await Class.findAll();
        const endOfYear = new Date('2025-12-31');
        for (const cls of classes) {
            const startDate = new Date(cls.startDate);
            // Determine time from schedule (e.g., "Seg/Qua 19:00")
            const timeMatch = cls.schedule?.match(/(\d{2}:\d{2})/);
            const startTime = timeMatch ? timeMatch[1] : '19:00';
            const endTime = '21:00'; // default 2h
            let cur = new Date(startDate);
            while (cur <= endOfYear) {
                const dateStr = cur.toISOString().split('T')[0];
                // Check if session already exists to avoid duplicates
                const exists = await ClassSession.findOne({ where: { classId: cls.id, date: dateStr } });
                if (!exists) {
                    await ClassSession.create({
                        classId: cls.id,
                        moduleId: 1, // placeholder
                        date: dateStr,
                        startTime,
                        endTime,
                        status: 'scheduled'
                    });
                    console.log(`✅ Sessão criada: class ${cls.id} date ${dateStr}`);
                }
                // advance one week
                cur.setDate(cur.getDate() + 7);
            }
        }
        console.log('✅ Todas as sessões criadas/confirmadas');
    } catch (e) {
        console.error('Erro:', e);
    } finally {
        process.exit();
    }
})();
