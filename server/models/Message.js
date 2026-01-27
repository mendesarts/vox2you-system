const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    direction: {
        type: DataTypes.ENUM('IN', 'OUT'),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('SENT', 'DELIVERED', 'READ', 'PENDING_SEND'),
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        defaultValue: 'text' // text, image, audio
    },
    leadId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = Message;
