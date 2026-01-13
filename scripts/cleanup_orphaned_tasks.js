const { sequelize } = require('./server/models');

async function deleteOrphanedTasks() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        console.log('Connection successful.');

        console.log('Checking for orphaned tasks...');

        // Get count of orphaned tasks before deletion for logging
        const [results] = await sequelize.query(`
            SELECT count(*) as count 
            FROM Tasks 
            WHERE leadId IS NOT NULL 
            AND leadId NOT IN (SELECT id FROM Leads)
        `);

        const count = results[0]?.count || results[0]?.['count(*)'] || 0;
        console.log(`Found ${count} orphaned tasks.`);

        if (count > 0) {
            console.log('Deleting orphaned tasks...');
            await sequelize.query(`
                DELETE FROM Tasks 
                WHERE leadId IS NOT NULL 
                AND leadId NOT IN (SELECT id FROM Leads)
            `);
            console.log('Deletion complete.');
        } else {
            console.log('No orphaned tasks to delete.');
        }

    } catch (error) {
        console.error('Error executing cleanup:', error);
    } finally {
        await sequelize.close();
    }
}

deleteOrphanedTasks();
