const fs = require('fs');
const path = require('path');
const { User } = require('./server/models');

async function debugUsers() {
    const logPath = path.join(__dirname, 'debug_users_final.txt');
    try {
        const users = await User.findAll({ attributes: ['email', 'role', 'roleId', 'password'] });
        let output = 'DEBUG_LOG\n';
        users.forEach(u => {
            output += `Email: ${u.email} | Role: ${u.role} | RoleID: ${u.roleId} | Password: ${u.password.substring(0, 5)}...\n`;
        });
        fs.writeFileSync(logPath, output);
        console.log('Finished writing log');
    } catch (e) {
        fs.writeFileSync(logPath, 'ERROR: ' + e.message + '\n' + e.stack);
    } finally {
        process.exit();
    }
}

debugUsers();
