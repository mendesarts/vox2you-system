const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Mentorship = sequelize.define('Mentorship', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    scheduledDate: {
        type: DataTypes.DATE, // Data e hora
        allowNull: false
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
        allowNull: true // Can be assigned later or changed
    }
});
// Relações: Student, Professor (Mentor)

module.exports = Mentorship;
