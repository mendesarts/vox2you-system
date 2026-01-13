const ROLES_MAP = {
    1: 'Master',
    10: 'Diretor',
    20: 'Franqueado',
    30: 'Gestor',
    40: 'Lider Comercial',
    41: 'Consultor',
    50: 'Lider Pedagogico',
    51: 'Pedagogico',
    60: 'Administrativo'
};

const ROLE_IDS = {
    MASTER: 1,
    DIRECTOR: 10,
    FRANCHISEE: 20,
    MANAGER: 30,
    LEADER_SALES: 40,
    CONSULTANT: 41,
    LEADER_PEDAGOGICAL: 50,
    INSTRUCTOR: 51,
    ADMIN_FINANCIAL: 60
};

const getRoleId = (roleName) => {
    if (!roleName) return null;
    if (typeof roleName === 'number') return roleName; // Already an ID

    // Normalize input
    const normalized = roleName.toString().toLowerCase().trim();

    // Check if it's a numeric string
    if (!isNaN(normalized) && ROLES_MAP[parseInt(normalized)]) {
        return parseInt(normalized);
    }

    for (const [id, name] of Object.entries(ROLES_MAP)) {
        if (name.toLowerCase() === normalized) return parseInt(id);
    }

    // Fallback for slugs
    const legacyMap = {
        'master': 1,
        'director': 10,
        'franchisee': 20,
        'manager': 30,
        'sales_leader': 40,
        'lider_comercial': 40,
        'consultant': 41,
        'consultor': 41,
        'pedagogical_leader': 50,
        'lider_pedagogico': 50,
        'financial_admin': 60,
        'admin_financeiro': 60
    };

    return legacyMap[normalized] || null;
};

module.exports = {
    ROLES_MAP,
    ROLE_IDS,
    getRoleId
};
