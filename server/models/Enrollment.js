const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Enrollment = sequelize.define('Enrollment', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    status: {
        type: DataTypes.ENUM('active', 'completed', 'dropped'),
        defaultValue: 'active'
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    courseId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    classId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    unitId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    enrollmentDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = Enrollment;
