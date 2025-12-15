const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { validateCPF, validatePhone } = require('../utils/validators');

const Student = sequelize.define('Student', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    // Lead info (optional link)
    leadId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    unitId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    // Personal Info
    registrationNumber: {
        type: DataTypes.INTEGER,
        // autoIncrement: true, // SQLite limitation: only PK can be autoincrement easily
        // unique: true // SQLite limitation: cannot generic ALTER TABLE ADD UNIQUE
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    gender: {
        type: DataTypes.STRING
    },
    birthDate: {
        type: DataTypes.DATEONLY
    },
    profession: {
        type: DataTypes.STRING
    },
    workplace: { // Empresa/Local de trabalho
        type: DataTypes.STRING
    },
    cpf: {
        type: DataTypes.STRING,
        unique: true,
        validate: {
            isValidCPF(value) {
                if (value && !validateCPF(value)) {
                    throw new Error('CPF inválido');
                }
            }
        }
    },
    // Address
    cep: { type: DataTypes.STRING },
    address: { type: DataTypes.STRING },
    neighborhood: { type: DataTypes.STRING }, // Bairro
    city: { type: DataTypes.STRING },
    // Contact
    mobile: {
        type: DataTypes.STRING,
        validate: {
            isValid(value) {
                if (value && !validatePhone(value)) {
                    throw new Error('Celular inválido');
                }
            }
        }
    }, // Celular
    phone: { type: DataTypes.STRING }, // Telefone Fixo
    email: {
        type: DataTypes.STRING,
        validate: { isEmail: true }
    },
    // Responsible (if minor)
    responsibleName: { type: DataTypes.STRING },
    responsiblePhone: { type: DataTypes.STRING },

    // System Status
    status: {
        type: DataTypes.ENUM('active', 'locked', 'cancelled', 'completed'),
        defaultValue: 'active'
    },
    contractStatus: {
        type: DataTypes.ENUM('pending', 'signed'),
        defaultValue: 'pending'
    },
    paymentStatus: {
        type: DataTypes.ENUM('pending', 'paid', 'late'),
        defaultValue: 'pending'
    }
});

// Associations defined in index.js usually, but logic:
// Student belongsTo Class (Turma Atual)
// Student belongsTo Course (Curso Atual - if convenient to denormalize or through Class)

module.exports = Student;
