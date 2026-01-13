const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CadenceLog = sequelize.define('CadenceLog', {
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
    cadence_type: {
        type: DataTypes.ENUM('Bolo', 'Negociação'),
        allowNull: false
    },
    step_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.STRING,
        allowNull: true
    },
    timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'CadenceLogs',
    timestamps: true
});

CadenceLog.associate = (models) => {
    CadenceLog.belongsTo(models.Lead, { foreignKey: 'leadId', as: 'lead' });
};

module.exports = CadenceLog;
