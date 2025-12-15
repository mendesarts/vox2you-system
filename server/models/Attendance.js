const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define('Attendance', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    present: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    justification: {
        type: DataTypes.TEXT,
        allowNull: true
    }
});
// Relações: Student, Class

module.exports = Attendance;
