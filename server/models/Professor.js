const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Professor = sequelize.define('Professor', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING
    },
    disciplines: { // Disciplinas ministradas (armazenado como JSON strings se simples, ou relação)
        type: DataTypes.STRING // Simplificando para string separada por vírgula ou JSON string
    }
});

module.exports = Professor;
