// CLIENT ROLE CONFIG (Mirrors Server)
export const ROLE_IDS = {
    MASTER: 1,
    DIRECTOR: 10,
    FRANCHISEE: 20, // Franqueado
    MANAGER: 30, // Gestor
    LEADER_SALES: 40,
    LEADER_PEDAGOGICAL: 50,
    ADMIN_FINANCIAL: 60,

    // Sub-levels (Implicit)
    CONSULTANT: 41,
    INSTRUCTOR: 51,
    SECRETARY: 52
};

// Groups for UI Logic
export const ROLE_GROUPS = {
    GLOBAL: [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR], // See All
    ADMIN: [ROLE_IDS.MASTER, ROLE_IDS.DIRECTOR, ROLE_IDS.FRANCHISEE, ROLE_IDS.MANAGER, ROLE_IDS.ADMIN_FINANCIAL],
    COMMERCIAL: [ROLE_IDS.LEADER_SALES, ROLE_IDS.CONSULTANT, ROLE_IDS.FRANCHISEE, ROLE_IDS.MANAGER],
    PEDAGOGICAL: [ROLE_IDS.LEADER_PEDAGOGICAL, ROLE_IDS.INSTRUCTOR, ROLE_IDS.SECRETARY, ROLE_IDS.FRANCHISEE, ROLE_IDS.MANAGER]
};

// UI Helpers (Labels & Colors)
export const ROLE_LABELS = {
    [ROLE_IDS.MASTER]: 'Master',
    [ROLE_IDS.DIRECTOR]: 'Diretor',
    [ROLE_IDS.FRANCHISEE]: 'Franqueado',
    [ROLE_IDS.MANAGER]: 'Gestor',
    [ROLE_IDS.LEADER_SALES]: 'Líder Comercial',
    [ROLE_IDS.CONSULTANT]: 'Consultor'
};

export const ROLE_COLORS = {
    [ROLE_IDS.MASTER]: 'border-status-gold', // Gold
    [ROLE_IDS.DIRECTOR]: 'border-status-gold', // Gold
    [ROLE_IDS.FRANCHISEE]: 'border-status-teal', // Teal (#05aaa8)
    [ROLE_IDS.MANAGER]: 'border-status-teal', // Teal
    // Default
    'DEFAULT': 'border-l-4 border-gray-200'
};
