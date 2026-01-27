const { generateEngagementTasks } = require('./services/engagementTasks');
const { sequelize } = require('./models');

async function run() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados.\n');

        await generateEngagementTasks();

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

run();
