const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Mentorship = sequelize.define('Mentorship', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    scheduledDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    topic: {
        type: DataTypes.STRING,
        allowNull: true
    },
    duration: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 60
    },
    status: {
        type: DataTypes.ENUM('scheduled', 'completed', 'cancelled', 'noshow'),
        defaultValue: 'scheduled'
    },
    notes: {
        type: DataTypes.TEXT
    },
    studentId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    mentorId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    professorId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    classId: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
});
// Relações: Student, Professor (Mentor)

module.exports = Mentorship;
