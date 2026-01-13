const { Sequelize } = require('sequelize');
const User = require('./server/models/User'); // Ajuste o caminho se necessário
const sequelize = require('./server/config/database');

// Mapeamento reverso de Role IDs para facilitar leitura
const ROLE_NAMES = {
    1: 'master',
    10: 'director',
    20: 'franchisee',
    30: 'manager',
    40: 'sales_leader',
    41: 'consultant',
    50: 'pedagogical_leader',
    51: 'instructor',
    60: 'admin_financial_manager',
    61: 'secretary'
};

async function findMaster() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        // Busca usuários com Role ID 1 (Master) ou Role String 'master'
        const masters = await User.findAll({
            where: Sequelize.or(
                { roleId: 1 },
                { role: 'master' }
            )
        });

        if (masters.length === 0) {
            console.log('Nenhum usuário Master encontrado.');

            // Busca TODOS os usuários para ajudar a diagnosticar
            const allUsers = await User.findAll({
                attributes: ['id', 'name', 'email', 'role', 'roleId']
            });
            console.log('\n--- Lista de Usuários Existentes ---');
            allUsers.forEach(u => {
                const roleName = ROLE_NAMES[u.roleId] || u.role || 'Desconhecido';
                console.log(`ID: ${u.id} | Nome: ${u.name} | Email: ${u.email} | Role: ${roleName} (ID: ${u.roleId})`);
            });

        } else {
            console.log(`\nEncontrado(s) ${masters.length} usuário(s) Master:`);
            masters.forEach(u => {
                console.log(`Email: ${u.email} | Senha Hash: ${u.password.substring(0, 10)}...`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('Erro:', error);
        process.exit(1);
    }
}

findMaster();
