const { Lead, Task, CadenceLog, ContactAttempt, sequelize } = require('./server/models');

async function clean() {
    try {
        console.log('Connecting...');
        await sequelize.authenticate();
        console.log('Connection successful.');

        console.log('Deleting Tasks...');
        await Task.destroy({ where: {} });

        console.log('Deleting CadenceLogs...');
        await CadenceLog.destroy({ where: {} });

        console.log('Deleting ContactAttempts...');
        await ContactAttempt.destroy({ where: {} });

        console.log('Deleting Leads...');
        await Lead.destroy({ where: {} });

        console.log('Deletion Complete.');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

clean();
