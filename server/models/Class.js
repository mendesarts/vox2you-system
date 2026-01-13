const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Course = require('./Course');

const Class = sequelize.define('Class', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: { // Nome da turma (Ex: Turma A)
        type: DataTypes.STRING,
        allowNull: false
    },
    classNumber: { // Número da turma / Código
        type: DataTypes.STRING,
        allowNull: true
    },
    capacity: {
        type: DataTypes.INTEGER,
        defaultValue: 20
    },
    status: {
        type: DataTypes.ENUM('planned', 'active', 'finished', 'cancelled'),
        defaultValue: 'planned'
    },
    days: { // Dias da semana (Ex: "Seg,Qua" ou JSON ["Seg", "Qua"])
        type: DataTypes.STRING,
        allowNull: true
    },
    startTime: {
        type: DataTypes.TIME,
        allowNull: true
    },
    endTime: {
        type: DataTypes.TIME,
        allowNull: true
    },
    startDate: {
        type: DataTypes.DATEONLY
    },
    endDate: {
        type: DataTypes.DATEONLY
    },
    courseId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    professorId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    unitId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});

// Associações serão definidas no index principal ou aqui se preferir carregar tudo
// Class.belongsTo(Course);
// Class.belongsTo(Professor);

module.exports = Class;
