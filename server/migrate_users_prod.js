const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    logging: false
});

async function migrateUsersTable() {
    try {
        console.log('🔄 Conectando ao Banco de Dados (Produção)...');
        await sequelize.authenticate();
        console.log('✅ Conectado.');

        const queryInterface = sequelize.getQueryInterface();

        // Lista de colunas para verificar/adicionar
        const columnsToAdd = [
            { name: 'whatsapp', type: DataTypes.STRING, allowNull: true },
            { name: 'position', type: DataTypes.STRING, allowNull: true },
            { name: 'profilePicture', type: DataTypes.TEXT, allowNull: true },
            { name: 'forcePasswordChange', type: DataTypes.BOOLEAN, defaultValue: false },
            { name: 'active', type: DataTypes.BOOLEAN, defaultValue: true },
            { name: 'color', type: DataTypes.STRING, defaultValue: '#05AAA8' }
        ];

        for (const col of columnsToAdd) {
            try {
                // Tenta descrever a tabela para ver se a coluna existe (ou tenta adicionar direto e pega erro)
                // Vamos tentar adicionar direto, se der erro de "already exists", ignoramos.
                console.log(`🛠 Verificando coluna: ${col.name}...`);
                await queryInterface.addColumn('Users', col.name, {
                    type: col.type,
                    allowNull: col.allowNull !== undefined ? col.allowNull : true,
                    defaultValue: col.defaultValue
                });
                console.log(`✅ Coluna '${col.name}' adicionada com sucesso.`);
            } catch (error) {
                if (error.original && error.original.code === '42701') { // duplicate_column
                    console.log(`ℹ️ Coluna '${col.name}' já existe.`);
                } else {
                    console.error(`❌ Erro ao adicionar '${col.name}':`, error.message);
                }
            }
        }

        console.log('🏁 Migração concluída.');

    } catch (error) {
        console.error('❌ Erro Crítico:', error);
    } finally {
        await sequelize.close();
    }
}

migrateUsersTable();
