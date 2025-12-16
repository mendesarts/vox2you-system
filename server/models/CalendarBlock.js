const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CalendarBlock = sequelize.define('CalendarBlock', {
    userId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    startTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    endTime: {
        type: DataTypes.DATE,
        allowNull: false
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = CalendarBlock;
