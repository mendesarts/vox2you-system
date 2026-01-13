const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StudentLog = sequelize.define('StudentLog', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    action: {
        type: DataTypes.STRING, // e.g., 'ATTENDANCE', 'TRANSFER', 'ENROLLMENT'
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    details: {
        type: DataTypes.JSON, // For storing flexible metadata
        allowNull: true
    },
    date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = StudentLog;
