const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'server', 'voxflow.sqlite'),
    logging: false
});

const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    role: DataTypes.STRING,
    roleId: DataTypes.INTEGER,
    unitId: DataTypes.INTEGER
}, { tableName: 'Users' });

async function listUsers() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
        const users = await User.findAll();

        console.log('--- USERS IN DB ---');
        users.forEach(u => {
            console.log(`ID: ${u.id} | Name: ${u.name} | Role: ${u.role} (ID: ${u.roleId}) | UnitID: ${u.unitId} | Email: ${u.email}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

listUsers();
