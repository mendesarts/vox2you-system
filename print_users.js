const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

async function debugDB() {
    const dbPath = path.join(__dirname, 'server', 'voxflow.sqlite');
    console.log('Database Path:', dbPath);
    console.log('Exists:', fs.existsSync(dbPath));

    const sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: dbPath,
        logging: false
    });

    const User = sequelize.define('User', {
        email: { type: Sequelize.STRING },
        role: { type: Sequelize.STRING },
        roleId: { type: Sequelize.INTEGER },
        password: { type: Sequelize.STRING }
    }, { tableName: 'Users' });

    try {
        await sequelize.authenticate();
        console.log('Connected.');
        const users = await User.findAll();
        console.log('Total Users:', users.length);
        console.log('--- USER LIST ---');
        users.forEach(u => {
            console.log(`Email: [${u.email}] | Role: [${u.role}] | RoleID: [${u.roleId}] | Pwd: [${u.password}]`);
        });
        console.log('--- END LIST ---');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}

debugDB();
