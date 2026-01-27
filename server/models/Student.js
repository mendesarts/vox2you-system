const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { validateCPF, validatePhone } = require('../utils/validators');

const Student = sequelize.define('Student', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    // Lead info (optional link)
    leadId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    unitId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Creator or Responsible Consultant'
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
    // Responsible (if minor) / Financial Responsible
    responsibleName: { type: DataTypes.STRING },
    responsiblePhone: { type: DataTypes.STRING },
    responsibleMobile: { type: DataTypes.STRING },
    responsibleEmail: { type: DataTypes.STRING },
    responsibleCPF: { type: DataTypes.STRING },
    // Parent Information
    fatherName: { type: DataTypes.STRING },
    fatherProfession: { type: DataTypes.STRING },
    fatherEmail: { type: DataTypes.STRING },
    fatherPhone: { type: DataTypes.STRING },
    fatherMobile: { type: DataTypes.STRING },
    motherName: { type: DataTypes.STRING },
    motherProfession: { type: DataTypes.STRING },
    motherEmail: { type: DataTypes.STRING },
    motherPhone: { type: DataTypes.STRING },
    motherMobile: { type: DataTypes.STRING },
    // Additional fields
    rg: { type: DataTypes.STRING },
    state: { type: DataTypes.STRING },
    addressNumber: { type: DataTypes.STRING },
    addressComplement: { type: DataTypes.STRING },
    workPhone: { type: DataTypes.STRING },
    observation: { type: DataTypes.TEXT },
    registrationDate: { type: DataTypes.DATEONLY },

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
    },
    classId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    courseId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    metadata: {
        type: DataTypes.TEXT, // Using TEXT for SQLite JSON compatibility
        allowNull: true,
        get() {
            const rawValue = this.getDataValue('metadata');
            try {
                return rawValue ? JSON.parse(rawValue) : {};
            } catch (e) {
                return {};
            }
        },
        set(value) {
            this.setDataValue('metadata', JSON.stringify(value));
        }
    }
});

// Associations defined in index.js usually, but logic:
// Student belongsTo Class (Turma Atual)
// Student belongsTo Course (Curso Atual - if convenient to denormalize or through Class)

module.exports = Student;
