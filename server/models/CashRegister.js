const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CashRegister = sequelize.define('CashRegister', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    unitId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    openingBalance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    closingBalance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    currentBalance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    openedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    closedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('open', 'closed'),
        defaultValue: 'open'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
});

module.exports = CashRegister;
