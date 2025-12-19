const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // Restored UUID
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        // Aceita tanto os termos em PT quanto EN para evitar erros
        type: DataTypes.ENUM(
            'master', 'admin',
            'franqueado', 'franchisee',
            'manager', 'gestor',
            'sales', 'consultor',
            'financial', 'financeiro',
            'pedagogico', 'pedagogical',
            'lider_comercial', 'sales_leader',
            'lider_pedagogico', 'pedagogical_leader',
            'admin_financeiro', 'admin_financial_manager',
            'diretor', 'director'
        ),
        defaultValue: 'sales',
    },
    // --- A CORREÇÃO CRÍTICA ESTÁ AQUI (MANTIDA) ---
    unit: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Sem Unidade'
    },
    // ------------------------------------
    unitId: {
        type: DataTypes.UUID, // Restored UUID
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    whatsapp: {
        type: DataTypes.STRING,
        allowNull: true
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    profilePicture: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

module.exports = User;
