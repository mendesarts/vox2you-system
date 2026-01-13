const Task = require('../models/Task');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

async function cleanup() {
    try {
        console.log('--- DEBUG INFO ---');
        console.log('Dialect:', sequelize.getDialect());
        if (sequelize.options.storage) console.log('Storage Path:', sequelize.options.storage);

        const totalTasks = await Task.count();
        console.log('Total de tarefas encontradas no banco:', totalTasks);

        console.log('Iniciando limpeza de tarefas duplicadas...');

        // 1. Encontrar todos os leadIds que possuem mais de uma tarefa pendente na categoria 'commercial'
        const duplicates = await Task.findAll({
            where: {
                status: 'pending',
                category: 'commercial',
                leadId: { [Op.ne]: null }
            },
            attributes: ['leadId', [sequelize.fn('COUNT', sequelize.col('id')), 'taskCount']],
            group: ['leadId'],
            having: sequelize.literal('count(id) > 1')
        });

        console.log(`Encontrados ${duplicates.length} leads com tarefas duplicadas de categoria 'commercial'.`);

        // Check if there are tasks without category too
        const nullCategoryDuplicates = await Task.findAll({
            where: {
                status: 'pending',
                category: null,
                leadId: { [Op.ne]: null }
            },
            attributes: ['leadId', [sequelize.fn('COUNT', sequelize.col('id')), 'taskCount']],
            group: ['leadId'],
            having: sequelize.literal('count(id) > 1')
        });
        console.log(`Encontrados ${nullCategoryDuplicates.length} leads com tarefas duplicadas SEM categoria.`);

        const allDuplicates = [...duplicates, ...nullCategoryDuplicates];

        for (const entry of allDuplicates) {
            const leadId = entry.leadId;

            // 2. Para cada leadId, buscar todas as tarefas pendentes ordendas pela data de criação
            const tasks = await Task.findAll({
                where: {
                    leadId,
                    status: 'pending'
                },
                order: [['createdAt', 'DESC']]
            });

            if (tasks.length > 1) {
                // Manter a primeira (mais recente) e fechar as outras
                const [latest, ...others] = tasks;
                const otherIds = others.map(t => t.id);

                console.log(`Lead #${leadId}: Mantendo tarefa #${latest.id} ("${latest.title}"), fechando ${otherIds.length} tarefas anteriores.`);

                await Task.update(
                    { status: 'done' },
                    { where: { id: { [Op.in]: otherIds } } }
                );
            }
        }

        console.log('Limpeza concluída com sucesso.');
        process.exit(0);
    } catch (error) {
        console.error('Erro na limpeza:', error);
        process.exit(1);
    }
}

cleanup();
