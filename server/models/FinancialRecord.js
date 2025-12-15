const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FinancialRecord = sequelize.define('FinancialRecord', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
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
    cashRegisterId: {
        type: DataTypes.UUID,
        allowNull: true
        // FK to CashRegister
    },
    unitId: {
        type: DataTypes.UUID,
        allowNull: true
    }
});

module.exports = FinancialRecord;
