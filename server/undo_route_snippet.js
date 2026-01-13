// POST alias for undo import (frontend compatibility)
router.post('/leads/import/undo/:importId', auth, async (req, res) => {
    try {
        const { importId } = req.params;
        const requester = req.user;

        if (!importId) return res.status(400).json({ error: 'Import ID required' });

        const allLeads = await Lead.findAll({
            attributes: ['id', 'metadata', 'unitId']
        });

        const idsToDelete = allLeads.filter(l => {
            // Security
            if (![ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(Number(requester.roleId)) && l.unitId !== requester.unitId) return false;

            const meta = typeof l.metadata === 'string' ? JSON.parse(l.metadata || '{}') : (l.metadata || {});
            return meta.createdByImportId === importId;
        }).map(l => l.id);

        if (idsToDelete.length > 0) {
            const Task = require('../models/Task');
            await Task.destroy({ where: { leadId: { [Op.in]: idsToDelete } } });
            await Lead.destroy({ where: { id: { [Op.in]: idsToDelete } } });
        }

        res.json({ success: true, deleted: idsToDelete.length });

    } catch (error) {
        console.error('Undo Import Error:', error);
        res.status(500).json({ error: error.message });
    }
});

