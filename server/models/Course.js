const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Course = sequelize.define('Course', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: { // Nome do curso
        type: DataTypes.STRING,
        allowNull: false
    },
    // Todos os cursos são de Oratória, portanto categoria fixa
    category: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Oratória'
    },
    workload: { // Carga horária em horas
        type: DataTypes.INTEGER,
        allowNull: false
    },
    weeklyFrequency: { // Frequência de aula semanal
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2
    },
    mentorshipsIncluded: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    // Código opcional removido
    // code field removed

});

module.exports = Course;
