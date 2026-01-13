const { Sequelize, DataTypes, Op } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'server', 'voxflow.sqlite'),
    logging: false
});

const Lead = sequelize.define('Lead', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    status: DataTypes.TEXT,
    name: DataTypes.STRING,
    nextTaskDate: DataTypes.DATE
}, { tableName: 'Leads' });

const Task = sequelize.define('Task', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    leadId: DataTypes.INTEGER,
    status: DataTypes.STRING,
    dueDate: DataTypes.DATE
}, { tableName: 'Tasks' });

Lead.hasMany(Task, { foreignKey: 'leadId' });
Task.belongsTo(Lead, { foreignKey: 'leadId' });

async function analyzeMissingTasks() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const leads = await Lead.findAll({
            include: [{
                model: Task,
                where: { status: 'pending' },
                required: false
            }]
        });

        console.log(`Total Leads: ${leads.length}`);

        const missingTasks = {};
        let totalMissing = 0;

        for (const lead of leads) {
            // A lead needs a task if it doesn't have any PENDING tasks
            // AND it is not in a terminal state (won, closed, archived)
            // AND (optionally) check nextTaskDate

            const hasPendingTask = lead.Tasks && lead.Tasks.length > 0;
            const isTerminal = ['won', 'closed', 'archived', 'lost'].includes(lead.status);

            if (!hasPendingTask && !isTerminal) {
                missingTasks[lead.status] = (missingTasks[lead.status] || 0) + 1;
                totalMissing++;
            }
        }

        console.log('--- LEADS WITHOUT PENDING TASKS (By Status) ---');
        console.log(missingTasks);
        console.log(`Total Active Leads without Tasks: ${totalMissing}`);

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

analyzeMissingTasks();
