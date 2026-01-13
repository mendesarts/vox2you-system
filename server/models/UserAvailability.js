const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserAvailability = sequelize.define('UserAvailability', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    dayOfWeek: {
        type: DataTypes.INTEGER, // 0-6 (Sun-Sat)
        allowNull: false
    },
    startTime: {
        type: DataTypes.TIME, // '09:00:00'
        allowNull: false
    },
    endTime: {
        type: DataTypes.TIME, // '18:00:00'
        allowNull: false
    }
});

module.exports = UserAvailability;
