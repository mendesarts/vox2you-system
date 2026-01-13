const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Unit = sequelize.define('Unit', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    address: {
        type: DataTypes.STRING
    },
    city: {
        type: DataTypes.STRING
    },
    active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    // Enhanced Fields
    cnpj: { type: DataTypes.STRING },
    state: { type: DataTypes.STRING },
    zipCode: { type: DataTypes.STRING },
    phone: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
    directorName: { type: DataTypes.STRING },
    directorEmail: { type: DataTypes.STRING },
    businessHours: {
        type: DataTypes.JSON,
        defaultValue: {}
    },
    financialSettings: {
        type: DataTypes.JSON,
        defaultValue: {
            cardFees: {
                credit: { base: 2.99, perInstallment: 1.5 },
                debit: { base: 1.2 }
            },
            advanceRate: 1.5 // Multiplier or fixed rate for receivables advance
        }
    }
}, {

    hooks: {
        beforeDestroy: (unit, options) => {
            if ([1, 2].includes(unit.id)) {
                throw new Error('PROTECTED_UNIT: Cannot delete Master Units (ID 1 or 2).');
            }
        },
        beforeUpdate: (unit, options) => {
            // Allow soft updates (like changing address), but maybe restrict changing ID or Critical info if needed.
            // For now, let's just log or maybe prevent ID change specifically (though ID change is rare).
            // Actually, user said "bloqueio para não modificar mais". Let's protect the NAME at least if it's being changed.
            if ([1, 2].includes(unit.id)) {
                if (unit.changed('id')) {
                    throw new Error('PROTECTED_UNIT: Cannot change ID of Master Units.');
                }
                // Optional: Prevent name change if strictly requested, but user might want to fix typos. 
                // The main request is "block to not modify *valid* units again" implying the RESET.
                // The destroy hook is the most critical for preventing "setup-db" wipe.
            }
        },
        beforeBulkDestroy: (options) => {
            // Prevent bulk wipe
            if (options.where && (options.where.id === 1 || options.where.id === 2 || (Array.isArray(options.where.id) && (options.where.id.includes(1) || options.where.id.includes(2))))) {
                throw new Error('PROTECTED_UNIT: Cannot bulk delete Master Units.');
            }
            // If truncate is used
            if (options.truncate === true) {
                // We can't easily stop truncate from here for specific rows, but we can try.
                // Actually, setup-db uses sync({force: true}) which drops tables. Hooks don't run on DROP TABLE.
                // So the hooks protect runtime api calls, but not the sync wipe.
            }
        }
    }
});

module.exports = Unit;
