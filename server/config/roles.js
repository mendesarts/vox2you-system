const ROLES_MAP = {
    1: 'Master',
    10: 'Diretor',
    20: 'Franqueado',
    30: 'Gestor',
    40: 'Lider Comercial',
    50: 'Lider Pedagogico',
    60: 'Administrativo'
};

const ROLE_IDS = {
    MASTER: 1,
    DIRECTOR: 10,
    FRANCHISEE: 20,
    MANAGER: 30,
    LEADER_SALES: 40,
    LEADER_PEDAGOGICAL: 50,
    ADMIN_FINANCIAL: 60
};

const getRoleId = (roleName) => {
    if (!roleName) return null;
    // Normalize input
    const normalized = roleName.toLowerCase().trim();

    for (const [id, name] of Object.entries(ROLES_MAP)) {
        if (name.toLowerCase() === normalized) return parseInt(id);
    }

    // Fallback for English terms if used in legacy code
    const legacyMap = {
        'master': 1,
        'director': 10,
        'franchisee': 20,
        'manager': 30,
        'sales_leader': 40,
        'pedagogical_leader': 50,
        'financial_admin': 60
    };

    return legacyMap[normalized] || null;
};

module.exports = {
    ROLES_MAP,
    ROLE_IDS,
    getRoleId
};
