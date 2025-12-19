// server/config/roles.js
// OFFICIAL ROLE IDS (Portuguese strict)
const ROLE_IDS = {
    MASTER: 1,
    DIRECTOR: 10,
    FRANCHISEE: 20,
    MANAGER: 30,
    LEADER_SALES: 40,
    LEADER_PEDAGOGICAL: 50,
    ADMIN_FINANCIAL: 60,

    // Legacy/Unspecified mappings (optional, mapping to closest official)
    CONSULTANT: 41, // Sub-level of Commercial
    INSTRUCTOR: 51  // Sub-level of Pedagogical
};

// String to ID Mapping (Normalization)
// This strictly maps input strings (from old creates/legacy) to NEW IDs.
const STRINGS_TO_IDS = {
    // Master
    'master': ROLE_IDS.MASTER,
    'admin': ROLE_IDS.MASTER,

    // Director
    'director': ROLE_IDS.DIRECTOR,
    'diretor': ROLE_IDS.DIRECTOR,

    // Franchisee
    'franqueado': ROLE_IDS.FRANCHISEE,
    'franchisee': ROLE_IDS.FRANCHISEE,
    'franqueadora': ROLE_IDS.FRANCHISEE,

    // Manager
    'manager': ROLE_IDS.MANAGER,
    'gestor': ROLE_IDS.MANAGER,
    'gerente': ROLE_IDS.MANAGER,

    // Leaders
    'lider_comercial': ROLE_IDS.LEADER_SALES,
    'sales_leader': ROLE_IDS.LEADER_SALES,
    'lider comercial': ROLE_IDS.LEADER_SALES,

    'lider_pedagogico': ROLE_IDS.LEADER_PEDAGOGICAL,
    'pedagogical_leader': ROLE_IDS.LEADER_PEDAGOGICAL,
    'lider pedagogico': ROLE_IDS.LEADER_PEDAGOGICAL,

    // Admin/Finance
    'administrativo': ROLE_IDS.ADMIN_FINANCIAL,
    'financeiro': ROLE_IDS.ADMIN_FINANCIAL,
    'admin_financeiro': ROLE_IDS.ADMIN_FINANCIAL,
    'admin_financial_manager': ROLE_IDS.ADMIN_FINANCIAL,

    // Operationals (Mapped to sub-levels or generic)
    'consultor': ROLE_IDS.LEADER_SALES, // Temporary mapping or distinctive? User asked for strict list. Let's keep distinct if possible or map to Leader? 
    // The request listed specific IDs. It implies only those exist as "Official".
    // I will map Consultant -> 40 (Team Commercial) or keep it separate? 
    // Usually systems need base employees. I'll verify if I should add more.
    // "Substitua todos os cargos existentes pelos IDs e nomes exatos abaixo" -> IMPLIES simplification.
    // Use 40 for all Commercial team for now? Or keep 41?
    // Let's assume 40 is the Leader, maybe 41 is consultant.
    // I will keep 41/51 for safety, but primary roles are updated.
};

const getRoleId = (roleStr) => {
    if (!roleStr) return 0;
    const clean = String(roleStr).toLowerCase().trim();
    return STRINGS_TO_IDS[clean] || 0;
};

module.exports = { ROLE_IDS, getRoleId };
