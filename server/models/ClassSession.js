const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ClassSession = sequelize.define('ClassSession', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    classId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    moduleId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    sessionNumber: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    topic: {
        type: DataTypes.STRING,
        allowNull: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    startTime: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '19:00'
    },
    endTime: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '21:00'
    },
    status: {
        type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
        defaultValue: 'scheduled'
    }
});

module.exports = ClassSession;
