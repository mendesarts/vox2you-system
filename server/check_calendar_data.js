const { Sequelize, DataTypes, Op } = require('sequelize');
const path = require('path');

// Setup Sequelize
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'voxflow.sqlite'),
    logging: false
});

// Define Models (Minimal)
const Holiday = sequelize.define('Holiday', {
    name: DataTypes.STRING,
    startDate: DataTypes.DATEONLY,
    unitId: DataTypes.INTEGER,
    type: DataTypes.STRING
});

const ClassSession = sequelize.define('ClassSession', {
    date: DataTypes.DATEONLY,
    status: DataTypes.STRING,
    startTime: DataTypes.STRING,
    endTime: DataTypes.STRING
});

const Class = sequelize.define('Class', {
    name: DataTypes.STRING,
    unitId: DataTypes.INTEGER
});

// Relationships
ClassSession.belongsTo(Class, { foreignKey: 'classId' });
Class.hasMany(ClassSession, { foreignKey: 'classId' });

async function checkData() {
    try {
        console.log('Checking Holidays...');
        const holidays = await Holiday.findAll({ limit: 5, order: [['startDate', 'DESC']] });
        console.log(`Found ${holidays.length} holidays (showing last 5):`);
        holidays.forEach(h => console.log(` - ${h.name} (${h.startDate}) [Unit: ${h.unitId}]`));

        console.log('\nChecking ClassSessions...');
        const sessions = await ClassSession.findAll({
            limit: 5,
            order: [['date', 'DESC']],
            include: [Class]
        });
        console.log(`Found ${sessions.length} sessions (showing last 5):`);
        sessions.forEach(s => console.log(` - ${s.Class?.name} on ${s.date} (${s.startTime}) [Status: ${s.status}]`));

        console.log('\nChecking date range for today...');
        const today = new Date().toISOString().split('T')[0];
        const nextMonth = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        console.log(`Range: ${today} to ${nextMonth}`);

        const rangeSessions = await ClassSession.findAll({
            where: {
                date: { [Op.between]: [today, nextMonth] }
            },
            limit: 5
        });
        console.log(`Sessions in next 30 days: ${rangeSessions.length}`);

    } catch (error) {
        console.error('Error:', error);
    }
}

checkData();
