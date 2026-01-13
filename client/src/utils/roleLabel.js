export const roleMap = {
    1: 'Master',
    2: 'Diretor',
    3: 'Consultor',
    4: 'Franqueado',
    10: 'Diretor', // example additional mapping
    41: 'Consultor', // existing mapping for role ID 41
    // add more role IDs as needed
};

export const getRoleName = (roleId) => {
    if (typeof roleId === 'string') roleId = Number(roleId);
    return roleMap[roleId] || 'Usuário';
};
