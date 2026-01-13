const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
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
        type: DataTypes.STRING, // Downgraded to String for Legacy Support
        allowNull: true
    },
    roleId: {
        type: DataTypes.INTEGER, // NEW STRENGTHENED ID
        allowNull: true // Allow null during migration, then strict
    },
    // --- A CORREÇÃO CRÍTICA ESTÁ AQUI (MANTIDA) ---
    unit: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'Sem Unidade'
    },
    // ------------------------------------
    unitId: {
        type: DataTypes.INTEGER,
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
    },
    workingHours: {
        type: DataTypes.JSON,
        allowNull: true
    },
    canMentorship: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    goal: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
        allowNull: true
    },
    secondaryRoles: {
        type: DataTypes.JSON, // Stores array of role IDs e.g. [51, 41]
        defaultValue: [],
        allowNull: true
    }
});

module.exports = User;
