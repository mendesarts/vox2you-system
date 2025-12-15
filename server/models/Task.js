const { DataTypes } = require('sequelize');
const sequelize = require('../index').sequelize || new (require('sequelize'))(process.env.DATABASE_URL);

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
    }
});

module.exports = Task;
