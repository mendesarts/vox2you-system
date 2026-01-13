const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'server', 'voxflow.sqlite'),
    logging: console.log
});

async function upgrade() {
    try {
        const queryInterface = sequelize.getQueryInterface();

        console.log('🚀 Retry: Adicionando origin_id_importado...');

        // SQLite limitation workaround: Add column without UNIQUE, then add Index
        try {
            await queryInterface.addColumn('Leads', 'origin_id_importado', {
                type: DataTypes.STRING,
                allowNull: true
            });
            console.log('✅ Coluna origin_id_importado adicionada (sem unique).');
        } catch (err) {
            console.log(`⚠️ Erro ao adicionar coluna: ${err.message}`);
        }

        try {
            await queryInterface.addIndex('Leads', ['origin_id_importado'], {
                unique: true,
                name: 'leads_origin_id_importado_unique'
            });
            console.log('✅ Unique Index criado para origin_id_importado.');
        } catch (err) {
            console.log(`⚠️ Erro ao criar index (pode já existir): ${err.message}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Fatal Error:', error);
        process.exit(1);
    }
}

upgrade();
