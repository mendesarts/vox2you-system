const { Lead, Task, User, sequelize } = require('./server/models');

async function debug() {
    try {
        const lastLead = await Lead.findOne({
            order: [['createdAt', 'DESC']],
            include: [{ model: Task, as: 'tasks' }]
        });

        if (!lastLead) {
            console.log("No leads found.");
            return;
        }

        console.log(`Last Lead: ${lastLead.id} - ${lastLead.name} (${lastLead.status})`);
        console.log(`Lead Unit: ${lastLead.unitId}, Consultant: ${lastLead.consultant_id}`);
        console.log(`Created At: ${lastLead.createdAt}`);

        console.log("Tasks associated:");
        if (lastLead.tasks && lastLead.tasks.length > 0) {
            lastLead.tasks.forEach(t => {
                console.log(` - Task [${t.id}] "${t.title}" Status: ${t.status} User: ${t.userId} Date: ${t.dueDate}`);
            });
        } else {
            console.log(" - No tasks found for this lead.");

            // Try searching tasks by leadId manually just in case association alias is wrong
            const manualTasks = await Task.findAll({ where: { leadId: lastLead.id } });
            console.log(` - Manual Search Found: ${manualTasks.length} tasks.`);
            manualTasks.forEach(t => console.log(`   * [${t.id}] ${t.title} (User: ${t.userId})`));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

debug();
