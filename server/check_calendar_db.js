const { Lead, Task, CalendarBlock, Mentorship, Holiday, ClassSession } = require('./models');
const { Op } = require('sequelize');

async function check() {
    try {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const counts = {
            Leads: await Lead.count({ where: { appointmentDate: { [Op.between]: [start, end] } } }),
            Tasks: await Task.count({ where: { dueDate: { [Op.between]: [start, end] } } }),
            Blocks: await CalendarBlock.count({ where: { startTime: { [Op.between]: [start, end] } } }),
            Mentorships: await Mentorship.count({ where: { scheduledDate: { [Op.between]: [start, end] } } }),
            Holidays: await Holiday.count({ where: { startDate: { [Op.lte]: end }, endDate: { [Op.gte]: start } } }),
            Sessions: await ClassSession.count({ where: { date: { [Op.between]: [start.toISOString().split('T')[0], end.toISOString().split('T')[0]] } } })
        };

        console.log('Event counts for current month:', JSON.stringify(counts, null, 2));

        const sample = await ClassSession.findOne({ limit: 1 });
        if (sample) console.log('Sample ClassSession:', JSON.stringify(sample, null, 2));

        const sampleHoliday = await Holiday.findOne({ limit: 1 });
        if (sampleHoliday) console.log('Sample Holiday:', JSON.stringify(sampleHoliday, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

check();
