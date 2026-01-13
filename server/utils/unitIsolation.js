const { ROLE_IDS } = require('../config/roles');

/**
 * Validates if the requester has access to the given unit.
 * @param {Object} user req.user
 * @param {Number|String} targetUnitId The unitId of the resource
 * @returns {Boolean}
 */
const hasUnitAccess = (user, targetUnitId) => {
    const roleId = Number(user.roleId);
    const userUnitId = user.unitId;

    // Global roles: Master (1) and Director (10)
    if ([ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR].includes(roleId)) return true;

    // Unit-bound roles: Franchisee, Manager, etc.
    // Ensure both are treated as same type (they are usually numeric in this system now)
    return String(userUnitId) === String(targetUnitId);
};

/**
 * Middleware-like check for unit isolation.
 * Throws 403 if access is denied.
 */
const checkUnitIsolation = (res, user, targetUnitId) => {
    if (!hasUnitAccess(user, targetUnitId)) {
        res.status(403).json({ error: 'Acesso negado. Recurso pertence a outra unidade.' });
        return false;
    }
    return true;
};

module.exports = { hasUnitAccess, checkUnitIsolation };
