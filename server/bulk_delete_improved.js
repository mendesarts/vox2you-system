// POST /api/crm/leads/bulk-delete - Helper for Mass Deletion
router.post('/leads/bulk-delete', auth, async (req, res) => {
    try {
        const { leadIds } = req.body;
        console.log('🗑️ Bulk delete request:', { leadIds, count: leadIds?.length });

        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ error: 'Nenhum lead selecionado.' });
        }

        // Delete in order: Tasks -> ContactAttempts -> CadenceLogs -> Leads
        console.log('Deleting tasks...');
        const tasksDeleted = await Task.destroy({ where: { leadId: { [Op.in]: leadIds } } });
        console.log(`✓ Deleted ${tasksDeleted} tasks`);

        console.log('Deleting contact attempts...');
        const attemptsDeleted = await ContactAttempt.destroy({ where: { leadId: { [Op.in]: leadIds } } });
        console.log(`✓ Deleted ${attemptsDeleted} contact attempts`);

        console.log('Deleting cadence logs...');
        const logsDeleted = await CadenceLog.destroy({ where: { leadId: { [Op.in]: leadIds } } });
        console.log(`✓ Deleted ${logsDeleted} cadence logs`);

        console.log('Deleting leads...');
        const deletedCount = await Lead.destroy({ where: { id: { [Op.in]: leadIds } } });
        console.log(`✓ Deleted ${deletedCount} leads`);

        res.json({
            success: true,
            message: `${deletedCount} leads excluídos com sucesso.`,
            details: { leads: deletedCount, tasks: tasksDeleted, attempts: attemptsDeleted, logs: logsDeleted }
        });

    } catch (error) {
        console.error('❌ Bulk Delete Error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Erro ao excluir leads em massa: ' + error.message });
    }
});
