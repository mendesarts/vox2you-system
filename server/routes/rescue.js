const express = require('express');
const router = express.Router();
const sequelize = require('../config/database');
const { User, Unit } = require('../models');

// Rota de Emergência para Arrumar o Banco
router.get('/fix-db-structure', async (req, res) => {
    try {
        console.log('[RESCUE] Iniciando reparo de banco...');

        // 1. Force Sync to ensure columns exist (patent, unitId)
        await sequelize.sync({ alter: true });
        console.log('[RESCUE] Schema sincronizado.');

        // 2. Fix Specific User (Mendes)
        const user = await User.findOne({ where: { email: 'mendesarts@gmail.com' } });
        if (user) {
            let unit = await Unit.findOne({ where: { name: 'Brasília.ÁguasClaras' } });
            if (!unit) {
                unit = await Unit.create({
                    name: 'Brasília.ÁguasClaras',
                    city: 'Brasília',
                    active: true
                });
            }
            user.unitId = unit.id;
            await user.save();
            console.log('[RESCUE] Usuário mendesarts@gmail.com corrigido.');
        }

        res.json({
            success: true,
            message: 'Banco de dados reparado com sucesso! Tente fazer login novamente.'
        });

    } catch (error) {
        console.error('[RESCUE] Falha:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
