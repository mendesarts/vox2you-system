const { Task, Lead, User } = require('./server/models');
const { Op } = require('sequelize');

async function simulate() {
    try {
        console.log("Simulating Tasks Query for User 2 (Role 20, Unit 1)...");

        const unitId = 1;
        const roleId = 20; // Manager
        const id = 2; // Mendes

        let where = { unitId: 1 };

        // Date Filter (Broad)
        const start = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
        const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        where.dueDate = { [Op.between]: [start, end] };

        // Query
        const tasks = await Task.findAll({
            where,
            order: [['dueDate', 'ASC']],
            include: [
                { model: User, attributes: ['id', 'name', 'roleId'] },
                { model: Lead, attributes: ['id', 'status', 'name', 'source'] } // Check if this breaks
            ]
        });

        console.log(`Found ${tasks.length} tasks matching query.`);
        const t14 = tasks.find(t => t.id === 14);
        if (t14) {
            console.log("Task 14 FOUND!");
            console.log("Lead:", t14.Lead ? t14.Lead.name : "NULL (Association Error?)");
        } else {
            console.log("Task 14 NOT found in query result.");
        }

    } catch (e) {
        console.error("Query Failed:", e);
    } finally {
        // Force exit
        process.exit();
    }
}

simulate();
