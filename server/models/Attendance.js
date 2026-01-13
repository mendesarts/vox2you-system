const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Attendance = sequelize.define('Attendance', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    classId: { // Optional if not linked to ClassSession
        type: DataTypes.INTEGER,
        allowNull: true
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
