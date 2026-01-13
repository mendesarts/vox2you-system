const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UnitConfig = sequelize.define('UnitConfig', {
    unitId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    // Comerciais
    commercialGoals: {
        type: DataTypes.JSON,
        defaultValue: {
            unit: { sessions: 0, calls: 0, connections: 0, enrollments: 0, revenue: 0 },
            collaborators: {} // { userId: { session: 0, ... } }
        }
    },
    // Pedagógicos
    pedagogicalRules: {
        type: DataTypes.JSON,
        defaultValue: {
            consecutiveAbsencesLimit: 2,
            totalAbsencesLimit: 5,
            mentorshipGoal: 0
        }
    },
    // Financeiros (Substitui/Expande o que tinha no Unit)
    financialRules: {
        type: DataTypes.JSON,
        defaultValue: {
            paymentMethods: [
                {
                    name: "Maquininha Padrão",
                    debitFee: 1.2,
                    creditFee: 2.99,
                    installmentFee: 1.5,
                    anticipationRate: 1.5
                }
            ]
        }
    }
});

module.exports = UnitConfig;
