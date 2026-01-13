const fs = require('fs');
const path = require('path');
const { Sequelize, DataTypes } = require('sequelize');

// Direct connection to avoid association loops or other issues in index.js
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'server', 'voxflow.sqlite'),
    logging: false
});

const User = sequelize.define('User', {
    email: DataTypes.STRING,
    role: DataTypes.STRING,
    roleId: DataTypes.INTEGER,
    password: DataTypes.STRING
}, { tableName: 'Users' });

async function debug() {
    const logPath = path.join(__dirname, 'sqlite_dump.txt');
    try {
        await sequelize.authenticate();
        const users = await User.findAll();
        let out = 'USERS IN DB:\n';
        users.forEach(u => {
            out += `Email: ${u.email} | RoleID: ${u.roleId} | PwdHash: ${u.password.substring(0, 10)}...\n`;
        });
        fs.writeFileSync(logPath, out);
    } catch (e) {
        fs.writeFileSync(logPath, 'ERROR: ' + e.message);
    } finally {
        process.exit();
    }
}

debug();
