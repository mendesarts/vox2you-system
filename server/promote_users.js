const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'voxflow.sqlite'),
    logging: false
});

const User = sequelize.define('User', {
    email: DataTypes.STRING,
    role: DataTypes.STRING,
    roleId: DataTypes.INTEGER,
    password: DataTypes.STRING
}, { tableName: 'Users' });

async function promote() {
    try {
        await sequelize.authenticate();
        // Promote all franchisees to master for safety
        const affected = await User.update(
            { role: 'master', roleId: 1 },
            { where: { role: 'franchisee' } }
        );
        console.log(`Promoted ${affected[0]} users.`);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

promote();
