const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FinancialRecord = sequelize.define('FinancialRecord', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    type: {
        type: DataTypes.ENUM('matricula', 'curso', 'material', 'outros'),
        allowNull: false,
        defaultValue: 'outros'
    },
    category: {
        type: DataTypes.STRING, // e.g., 'Mensalidade', 'Taxa de Matrícula', 'Energia', 'Água', 'Salários'
        defaultValue: 'Receita'
    },
    direction: {
        type: DataTypes.ENUM('income', 'expense'),
        allowNull: false,
        defaultValue: 'income'
    },
    scope: {
        type: DataTypes.ENUM('business', 'personal'),
        defaultValue: 'business'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    paymentDate: {
        type: DataTypes.DATEONLY
    },
    paymentMethod: {
        type: DataTypes.STRING // 'pix', 'boleto', 'credit_card', 'debit_card', 'cash'
    },
    installments: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    currentInstallment: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    status: {
        type: DataTypes.ENUM('pending', 'paid', 'overdue', 'cancelled'),
        defaultValue: 'pending'
    },
    discount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    interest: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    fine: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0
    },
    cashRegisterId: {
        type: DataTypes.INTEGER,
        allowNull: true
        // FK to CashRegister
    },
    unitId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // Link to User (who created) or Student (payer)
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    planId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    launchType: {
        type: DataTypes.ENUM('unico', 'parcelado', 'recorrente'),
        defaultValue: 'unico'
    },
    periodicity: {
        type: DataTypes.STRING, // 'diaria', 'semanal', 'mensal', etc.
        defaultValue: 'mensal'
    }
});

module.exports = FinancialRecord;
