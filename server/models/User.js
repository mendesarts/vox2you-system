const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    whatsapp: {
        type: DataTypes.STRING,
        allowNull: true
    },
    profilePicture: {
        type: DataTypes.TEXT, // Base64 or URL
        allowNull: true
    },
    position: {
        type: DataTypes.STRING,
        allowNull: true
    },
    forcePasswordChange: {
        type: DataTypes.BOOLEAN,
        defaultValue: true // Usuários novos devem mudar a senha
    },
    role: {
        type: DataTypes.ENUM(
            'master', // Diretor / Franqueadora (Acesso Total)
            'franchisee', // Franqueado (Acesso Total Unidade)
            'manager', // Gestor (Acesso Total Unidade)
            'sales_leader', // Lider Comercial
            'sales', // Comercial/Consultor
            'pedagogical_leader', // Lider Pedagógico
            'pedagogical', // Pedagógico/Professor
            'admin_financial_manager', // Gerente Adm/Fin
            'admin', // Administrativo
            'financial' // Financeiro
        ),
        defaultValue: 'sales'
    },
    color: {
        type: DataTypes.STRING, // Hex code for custom UI color
        defaultValue: '#05AAA8'
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    unitId: {
        type: DataTypes.UUID,
        allowNull: true // Null = Head Office / Master
    }
});

module.exports = User;
