const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContactAttempt = sequelize.define('ContactAttempt', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    leadId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Leads', key: 'id' }
    },
    attempt_number: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    result: {
        type: DataTypes.STRING,
        allowNull: true
    },
    type: {
        type: DataTypes.STRING,
        allowNull: true // 'Tentativa', 'Agendamento'
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'ContactAttempts',
    timestamps: true
});

ContactAttempt.associate = (models) => {
    ContactAttempt.belongsTo(models.Lead, { foreignKey: 'leadId', as: 'lead' });
};

module.exports = ContactAttempt;
