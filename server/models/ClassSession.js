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
        allowNull: false
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    startTime: {
        type: DataTypes.STRING,
        allowNull: false
    },
    endTime: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
        defaultValue: 'scheduled'
    }
});

module.exports = ClassSession;
