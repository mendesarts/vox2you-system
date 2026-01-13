const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'voxflow.sqlite'),
    logging: false
});

const Unit = sequelize.define('Unit', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false }
}, {
    tableName: 'Units',
    timestamps: true
});

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
        const units = await Unit.findAll();
        console.log('UNITS IN DB:');
        units.forEach(u => console.log(`${u.id}: ${u.name}`));
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
})();
