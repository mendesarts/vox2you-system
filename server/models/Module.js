const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Module = sequelize.define('Module', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
});

// Associations:
// Module belongsTo Course
// Course hasMany Module

module.exports = Module;
