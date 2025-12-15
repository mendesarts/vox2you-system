const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Lead = sequelize.define('Lead', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false // Key for WhatsApp
    },
    email: {
        type: DataTypes.STRING
    },
    source: { // Origin (Instagram, Google, Indication)
        type: DataTypes.STRING,
        defaultValue: 'Organic'
    },
    campaign: { // Marketing Campaign Name
        type: DataTypes.STRING
    },
    status: { // Kanban Stage
        type: DataTypes.ENUM,
        values: ['new', 'qualifying_ia', 'scheduled', 'no_show', 'negotiation', 'won', 'lost'],
        defaultValue: 'new'
    },
    handledBy: { // Who is talking?
        type: DataTypes.ENUM,
        values: ['AI', 'HUMAN'],
        defaultValue: 'AI'
    },
    consultantId: {
        type: DataTypes.UUID,
        allowNull: true // references Users.id
    },
    unitId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    aiStatus: { // Internal state of AI (e.g., waiting_response, needs_human)
        type: DataTypes.STRING,
        defaultValue: 'active'
    },
    attemptCount: { // Cadence counter
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    lastContactAt: {
        type: DataTypes.DATE
    },
    nextActionAt: { // Scheduling next cadence msg
        type: DataTypes.DATE
    },
    notes: {
        type: DataTypes.TEXT
    },
    history: { // JSON log of interactions
        type: DataTypes.TEXT, // Stored as JSON string
        defaultValue: '[]'
    }
});

module.exports = Lead;
