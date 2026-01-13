const { sequelize, Lead, Student, StudentLog, Task, ContactAttempt, CadenceLog, ClassSession, Mentorship } = require('./models');

async function purgeCRM() {
    console.log('--- INICIANDO LIMPEZA DO CRM ---');
    try {
        await sequelize.authenticate();
        console.log('✅ Conexão com banco de dados estabelecida.');

        // Desativar chaves estrangeiras para limpeza total (SQLite syntax)
        await sequelize.query('PRAGMA foreign_keys = OFF;');
        console.log('⚠️ Chaves estrangeiras desativadas temporariamente.');

        console.log('🗑️ Excluindo Tarefas COMERCIAIS...');
        await Task.destroy({
            where: {
                [require('sequelize').Op.or]: [
                    { category: 'commercial' },
                    { category: 'Marketing_2' }, // Added condition to delete Marketing_2 tasks
                    { leadId: { [require('sequelize').Op.ne]: null } }
                ]
            }
        });

        console.log('🗑️ Excluindo Sessões de Aula e Mentorias...');
        await ClassSession.destroy({ where: {}, truncate: true });
        await Mentorship.destroy({ where: {}, truncate: true });

        console.log('🗑️ Excluindo Logs de Cadência e Tentativas...');
        await CadenceLog.destroy({ where: {}, truncate: true });
        await ContactAttempt.destroy({ where: {}, truncate: true });

        console.log('🗑️ Excluindo Logs de Alunos...');
        await StudentLog.destroy({ where: {}, truncate: true });

        console.log('🗑️ Excluindo Alunos...');
        await Student.destroy({ where: {}, truncate: true });

        console.log('🗑️ Excluindo Leads...');
        await Lead.destroy({ where: {}, truncate: true });

        // Reativar chaves estrangeiras
        await sequelize.query('PRAGMA foreign_keys = ON;');
        console.log('✅ Chaves estrangeiras reativadas.');

        console.log('✨ LIMPEZA CONCLUÍDA COM SUCESSO! O sistema está pronto para uma nova importação.');

    } catch (error) {
        console.error('❌ ERRO DURANTE A LIMPEZA:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

purgeCRM();
