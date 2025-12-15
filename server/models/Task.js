const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'in_progress', 'done'),
        defaultValue: 'pending'
    },
    priority: {
        type: DataTypes.ENUM('low', 'medium', 'high'),
        defaultValue: 'medium'
    },
    category: {
        type: DataTypes.ENUM('pedagogical', 'administrative', 'commercial'),
        allowNull: true
    },
    unitId: {
        type: DataTypes.UUID,
        allowNull: true // Null = Global Task? Or enforce it?
    }
});

module.exports = Task;
