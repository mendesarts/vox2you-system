const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const auth = require('../middleware/auth');

// Middleware to ensure user is Master
const verifyMaster = (req, res, next) => {
    // req.user is populated by 'auth' middleware
    const isMaster = Number(req.user?.roleId) === 1 || req.user?.role?.toLowerCase() === 'master';
    if (!isMaster) {
        return res.status(403).json({ message: 'Acesso negado. Requer permissão MASTER.' });
    }
    next();
};

router.get('/', (req, res) => res.json({ status: 'online', timestamp: new Date() }));
router.get('/full', auth, verifyMaster, healthController.getSystemHealth);

module.exports = router;
