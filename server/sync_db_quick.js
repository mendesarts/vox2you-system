require('dotenv').config();
const sequelize = require('./config/database');

async function syncDatabase() {
    try {
        console.log('🔄 Sincronizando banco de dados...');

        // Force sync to update schema
        await sequelize.sync({ alter: true });

        console.log('✅ Banco sincronizado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao sincronizar:', error);
    } finally {
        await sequelize.close();
    }
}

syncDatabase();
