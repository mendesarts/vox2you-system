const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transfer = sequelize.define('Transfer', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    type: { // Transferência ou Reposição
        type: DataTypes.ENUM('transfer', 'replacement'),
        allowNull: false
    },
    reason: {
        type: DataTypes.TEXT
    },
    status: {
        type: DataTypes.ENUM('requested', 'approved', 'completed', 'rejected'),
        defaultValue: 'requested'
    },
    date: { // Data da solicitação ou movimentação
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});
// Relações: Student, SourceClass (Turma Origem), TargetClass (Turma Destino)

module.exports = Transfer;
