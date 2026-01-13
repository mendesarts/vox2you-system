const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize({ dialect: 'sqlite', storage: 'server/voxflow.sqlite' });
const Class = require('./models/Class');
const ClassSession = require('./models/ClassSession');
const { Op } = require('sequelize');

(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado ao DB');
        const classes = await Class.findAll();
        for (const cls of classes) {
            // Determine number of weeks (e.g., 8 weeks) from startDate
            const start = new Date(cls.startDate);
            for (let i = 0; i < 8; i++) {
                const sessionDate = new Date(start);
                sessionDate.setDate(start.getDate() + i * 7); // weekly
                const dateStr = sessionDate.toISOString().split('T')[0];
                // Use schedule field to infer time (e.g., "Seg/Qua 19:00")
                const timeMatch = cls.schedule?.match(/(\d{2}:\d{2})/);
                const startTime = timeMatch ? timeMatch[1] : '19:00';
                const endTime = '21:00'; // default 2h
                await ClassSession.create({
                    classId: cls.id,
                    moduleId: 1, // placeholder module
                    date: dateStr,
                    startTime,
                    endTime,
                    status: 'scheduled'
                });
            }
        }
        console.log('✅ Sessões criadas');
    } catch (e) {
        console.error('Erro:', e);
    } finally {
        process.exit();
    }
})();
