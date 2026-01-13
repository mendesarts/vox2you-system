const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transfer = sequelize.define('Transfer', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    fromClassId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    toClassId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    type: { // Transferência entre turmas ou unidades
        type: DataTypes.STRING,
        defaultValue: 'class_transfer'
    },
    reason: {
        type: DataTypes.TEXT
    },
    status: {
        type: DataTypes.ENUM('requested', 'approved', 'completed', 'rejected'),
        defaultValue: 'completed'
    },
    date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = Transfer;
