const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

async function debugDB() {
    const dbPath = path.join(__dirname, 'server', 'voxflow.sqlite');
    const outPath = path.join(__dirname, 'master_credentials.txt');

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
        const masters = await User.findAll({
            where: { role: 'master' }
        });

        let output = '';
        if (masters.length > 0) {
            masters.forEach(m => {
                output += `EMAIL: ${m.email}\nROLE: ${m.role}\nROLEID: ${m.roleId}\nPASSWORD: ${m.password}\n\n`;
            });
        } else {
            output = 'NO MASTER FOUND';
        }

        fs.writeFileSync(outPath, output);
    } catch (e) {
        fs.writeFileSync(outPath, 'ERROR: ' + e.message);
    } finally {
        process.exit();
    }
}

debugDB();
