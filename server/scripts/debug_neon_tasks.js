const { Sequelize, DataTypes } = require('sequelize');

const NEON_URL = "postgresql://neondb_owner:npg_Z0nhGM3LBOjQ@ep-withered-mountain-ahhvk6ww-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

const sequelize = new Sequelize(NEON_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

const Task = sequelize.define('Task', {
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    dueDate: DataTypes.DATE,
    status: DataTypes.ENUM('pending', 'in_progress', 'done'),
    priority: DataTypes.ENUM('low', 'medium', 'high'),
    category: DataTypes.ENUM('pedagogical', 'administrative', 'commercial'),
    leadId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER,
    unitId: DataTypes.INTEGER
});

const Lead = sequelize.define('Lead', {
    name: DataTypes.STRING,
    status: DataTypes.STRING,
    unitId: DataTypes.INTEGER,
    consultant_id: DataTypes.INTEGER,
    source: DataTypes.STRING
});

Lead.hasMany(Task, { foreignKey: 'leadId', as: 'tasks' });
Task.belongsTo(Lead, { foreignKey: 'leadId' }); // NOTE: No ON DELETE CASCADE here

async function debug() {
    try {
        await sequelize.authenticate();
        console.log("Connected to Neon.");

        const lastLead = await Lead.findOne({
            order: [['createdAt', 'DESC']],
            limit: 1
        });

        if (!lastLead) {
            console.log("No leads found in Neon.");
            return;
        }

        console.log(`Last Lead (Neon): ${lastLead.id} - ${lastLead.name} (${lastLead.status})`);

        const tasks = await Task.findAll({
            where: { leadId: lastLead.id }
        });

        console.log(`Tasks for Lead ${lastLead.id}: ${tasks.length}`);
        tasks.forEach(t => {
            console.log(` - [${t.id}] ${t.title} | Status: ${t.status} | User: ${t.userId}`);
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await sequelize.close();
    }
}

debug();
