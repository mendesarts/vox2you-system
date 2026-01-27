require('dotenv').config();
const { Student, Class, Course, FinancialRecord, User, Unit, Task, Enrollment, Attendance, Mentorship, sequelize } = require('./server/models');
const { Op, Sequelize } = require('sequelize');

async function test() {
    try {
        const getNumericId = (id) => {
            if (!id) return null;
            if (!isNaN(Number(id))) return Number(id);
            let hash = 0;
            const str = String(id);
            for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i) | 0;
            return Math.abs(hash);
        };

        const scope = {}; // Global test
        const now = new Date();
        const startPeriod = new Date(now.getFullYear(), now.getMonth(), 1);
        const endPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        console.log('Testing stats fetching...');
        const counts = await Promise.all([
            Student.count({ where: { ...scope, status: 'active' } }),
            Class.count({ where: { ...scope, status: 'active' } }),
            Class.count({ where: { ...scope, status: 'planned' } }),
            Student.count({ where: { ...scope, contractStatus: 'pending' } }),
            Class.count({ where: { ...scope, startDate: { [Op.between]: [startPeriod, endPeriod] } } }),
            Class.count({ where: { ...scope, endDate: { [Op.between]: [startPeriod, endPeriod] }, status: 'finished' } }),
            Student.count({ where: { ...scope, status: 'cancelled', updatedAt: { [Op.between]: [startPeriod, endPeriod] } } }),
            Student.count({ where: { ...scope, status: 'locked', updatedAt: { [Op.between]: [startPeriod, endPeriod] } } })
        ]);
        console.log('Counts:', counts);

        const [activeStudentsByCourse, activeClassesByCourse] = await Promise.all([
            Student.findAll({
                where: { ...scope, status: 'active' },
                attributes: ['courseInterest', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
                group: ['courseInterest']
            }),
            Class.findAll({
                where: { ...scope, status: 'active' },
                include: [{ model: Course, attributes: ['name'] }],
                attributes: [[Sequelize.fn('COUNT', Sequelize.col('Class.id')), 'count']],
                group: ['Course.id', 'Course.name']
            })
        ]);
        console.log('Course Stats fetched');

    } catch (e) {
        console.error('Test Failed:', e);
    } finally {
        process.exit();
    }
}
test();
