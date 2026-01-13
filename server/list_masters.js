const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'voxflow.sqlite'),
    logging: false
});

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    role: DataTypes.STRING,
    unitId: DataTypes.INTEGER
}, { tableName: 'Users' });

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected.');
        const masters = await User.findAll({ where: { role: 'master' } });
        console.log('MASTERS:');
        masters.forEach(m => console.log(`${m.id}: ${m.name} (${m.email}) - UnitID: ${m.unitId}`));
    } catch (error) {
        console.error(error);
    } finally {
        await sequelize.close();
    }
})();
