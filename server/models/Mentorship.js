const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Mentorship = sequelize.define('Mentorship', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
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
    }
});
// Relações: Student, Professor (Mentor)

module.exports = Mentorship;
