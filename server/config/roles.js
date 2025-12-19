// server/config/roles.js
// VIRTUAL ID MAPPING - CENTRAL SOURCE OF TRUTH
const ROLE_IDS = {
    // 1-9: Global/High Level
    MASTER: 1,      // 'master'
    DIRECTOR: 2,    // 'director', 'diretor'
    ADMIN: 3,       // 'admin'

    // 10-19: Management
    FRANCHISEE: 10, // 'franchisee', 'franqueado'
    MANAGER: 11,    // 'manager', 'gestor', 'gerente'

    // 20-29: Operational
    CONSULTANT: 20, // 'consultant', 'consultor', 'sales'
    LEADER_SALES: 21, // 'sales_leader'

    // 30-39: Pedagogical
    PEDAGOGICAL: 30, // 'pedagogico', 'pedagogical'
    LEADER_PEDAGOGICAL: 31, // 'pedagogical_leader'
    INSTRUCTOR: 32, // 'instructor', 'professor', 'teacher'
    SECRETARY: 33   // 'secretary'
};

const STRINGS_TO_IDS = {
    'master': ROLE_IDS.MASTER,
    'admin': ROLE_IDS.ADMIN,
    'diretor': ROLE_IDS.DIRECTOR,
    'director': ROLE_IDS.DIRECTOR,

    'franqueado': ROLE_IDS.FRANCHISEE,
    'franchisee': ROLE_IDS.FRANCHISEE,
    'franqueadora': ROLE_IDS.FRANCHISEE,

    'gestor': ROLE_IDS.MANAGER,
    'manager': ROLE_IDS.MANAGER,
    'gerente': ROLE_IDS.MANAGER,

    'consultor': ROLE_IDS.CONSULTANT,
    'consultant': ROLE_IDS.CONSULTANT,
    'vendedor': ROLE_IDS.CONSULTANT,
    'sales': ROLE_IDS.CONSULTANT,
    'comercial': ROLE_IDS.CONSULTANT,

    'lider_comercial': ROLE_IDS.LEADER_SALES,
    'sales_leader': ROLE_IDS.LEADER_SALES,

    'pedagogico': ROLE_IDS.PEDAGOGICAL,
    'pedagogical': ROLE_IDS.PEDAGOGICAL,

    'lider_pedagogico': ROLE_IDS.LEADER_PEDAGOGICAL,
    'pedagogical_leader': ROLE_IDS.LEADER_PEDAGOGICAL,
    'coord_pedagogico': ROLE_IDS.LEADER_PEDAGOGICAL,

    'professor': ROLE_IDS.INSTRUCTOR,
    'instructor': ROLE_IDS.INSTRUCTOR,
    'teacher': ROLE_IDS.INSTRUCTOR,
    'education': ROLE_IDS.INSTRUCTOR,

    'secretaria': ROLE_IDS.SECRETARY,
    'secretary': ROLE_IDS.SECRETARY
};

const getRoleId = (roleStr) => {
    if (!roleStr) return 0;
    const clean = String(roleStr).toLowerCase().trim();
    return STRINGS_TO_IDS[clean] || 99; // 99 = Unknown
};

module.exports = { ROLE_IDS, getRoleId };
