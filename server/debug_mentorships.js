const { Sequelize, DataTypes, Op } = require('sequelize');
const path = require('path');
const dbPath = path.join(__dirname, 'voxflow.sqlite'); // Correct DB path

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false
});

const Mentorship = sequelize.define('Mentorship', {
    date: { type: DataTypes.DATEONLY }, // Legacy date
    time: { type: DataTypes.STRING }, // Legacy time
    scheduledDate: { type: DataTypes.DATE }, // New datetime
    status: { type: DataTypes.STRING },
    notes: { type: DataTypes.TEXT },
    studentId: { type: DataTypes.INTEGER }
});

const Student = sequelize.define('Student', {
    name: { type: DataTypes.STRING },
    unitId: { type: DataTypes.INTEGER }
});

Mentorship.belongsTo(Student, { foreignKey: 'studentId' });

async function check() {
    try {
        const all = await Mentorship.findAll({
            include: [Student]
        });
        console.log('Total Mentorships:', all.length);
        all.forEach(m => {
            console.log(`ID: ${m.id}, Status: ${m.status}, ScheduledDate: ${m.scheduledDate}, Date: ${m.date}, Time: ${m.time}, Student: ${m.Student?.name} (Unit: ${m.Student?.unitId})`);
        });

        // Check backend logic simulation
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        console.log('\n--- Simulation ---');
        console.log('Filter Range:', startOfMonth.toISOString(), 'to', endOfMonth.toISOString());

        const filtered = all.filter(m => {
            const d = new Date(m.scheduledDate);
            return m.status === 'scheduled' && d >= startOfMonth && d <= endOfMonth;
        });
        console.log('Matches current month logic:', filtered.length);

    } catch (e) {
        console.error(e);
    }
}

check();
