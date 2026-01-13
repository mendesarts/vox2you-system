const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Configuração direta para o banco SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'server', 'voxflow.sqlite'),
    logging: console.log
});

async function upgrade() {
    try {
        console.log('🚀 Iniciando Evolução do Schema para Migração Importado...');
        const queryInterface = sequelize.getQueryInterface();

        // 1. EXPANDIR TABELA LEADS
        console.log('📦 Adicionando colunas nativas à tabela Leads...');

        const newLeadsColumns = {
            utm_source: { type: DataTypes.STRING, allowNull: true },
            utm_medium: { type: DataTypes.STRING, allowNull: true },
            utm_campaign: { type: DataTypes.STRING, allowNull: true },
            utm_term: { type: DataTypes.STRING, allowNull: true },
            origin_id_importado: { type: DataTypes.STRING, allowNull: true, unique: true },
            sales_value: { type: DataTypes.FLOAT, allowNull: true },
            enrollment_value: { type: DataTypes.FLOAT, allowNull: true },
            payment_method: { type: DataTypes.STRING, allowNull: true },
            course_interest: { type: DataTypes.STRING, allowNull: true },
            date_of_birth: { type: DataTypes.DATE, allowNull: true },
            loss_reason: { type: DataTypes.STRING, allowNull: true }
        };

        for (const [colName, definition] of Object.entries(newLeadsColumns)) {
            try {
                await queryInterface.addColumn('Leads', colName, definition);
                console.log(`✅ Coluna ${colName} adicionada.`);
            } catch (err) {
                console.log(`⚠️ Coluna ${colName} já existe ou erro: ${err.message}`);
            }
        }

        // 2. CRIAR TABELA CADENCE_LOGS
        console.log('📦 Criando tabela CadenceLogs...');
        await queryInterface.createTable('CadenceLogs', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            leadId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'Leads', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            cadence_type: {
                type: DataTypes.ENUM('Bolo', 'Negociação'),
                allowNull: false
            },
            step_name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            status: {
                type: DataTypes.STRING,
                allowNull: true
            },
            timestamp: {
                type: DataTypes.DATE,
                defaultValue: Sequelize.NOW
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false
            }
        });
        console.log('✅ Tabela CadenceLogs criada.');

        // 3. CRIAR TABELA CONTACT_ATTEMPTS
        console.log('📦 Criando tabela ContactAttempts...');
        await queryInterface.createTable('ContactAttempts', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            leadId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'Leads', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE'
            },
            attempt_number: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            result: {
                type: DataTypes.STRING,
                allowNull: true
            },
            type: {
                type: DataTypes.STRING,
                allowNull: true // 'Tentativa', 'Agendamento', etc.
            },
            timestamp: {
                type: DataTypes.DATE,
                defaultValue: Sequelize.NOW
            },
            createdAt: {
                type: DataTypes.DATE,
                allowNull: false
            },
            updatedAt: {
                type: DataTypes.DATE,
                allowNull: false
            }
        });
        console.log('✅ Tabela ContactAttempts criada.');

        console.log('\n✨ EVOLUÇÃO DO SCHEMA CONCLUÍDA COM SUCESSO!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ ERRO NA EVOLUÇÃO DO SCHEMA:');
        console.error(error);
        process.exit(1);
    }
}

upgrade();
