const express = require('express');
const router = express.Router();
const UnitConfig = require('../models/UnitConfig');
const User = require('../models/User');
const auth = require('../middleware/auth');
const Unit = require('../models/Unit');
const { ROLE_IDS } = require('../config/roles');

// GET /api/units
router.get('/', auth, async (req, res) => {
    try {
        const isGlobalUser = [1, 10].includes(Number(req.user.roleId));
        if (!isGlobalUser) return res.status(403).json({ error: 'Acesso negado' });
        const units = await Unit.findAll({ where: { active: true }, order: [['name', 'ASC']] });
        res.json(units);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/units/config
router.get('/config', auth, async (req, res) => {
    try {
        const { unitId } = req.user;
        if (!unitId) return res.status(400).json({ error: 'Unidade não identificada' });

        let config = await UnitConfig.findOne({ where: { unitId } });

        // Se não existir, cria um padrão
        if (!config) {
            config = await UnitConfig.create({ unitId });
        }

        // Buscar colaboradores da unidade para as metas individuais
        const collaborators = await User.findAll({
            where: { unitId },
            attributes: ['id', 'name', 'roleId'],
            // Apenas cargos comerciais ou liderança
            // roleId mapping: 10=Franchisee, 20=Director, 30=Manager, 40=Commercial Leader, 50=Consultant
        });

        res.json({ config, collaborators });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/units/config
router.post('/config', auth, async (req, res) => {
    try {
        const { unitId } = req.user;
        const { commercialGoals, pedagogicalRules, financialRules } = req.body;

        const config = await UnitConfig.upsert({
            unitId,
            commercialGoals,
            pedagogicalRules,
            financialRules
        });

        res.json({ success: true, config });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
