const { Sequelize } = require('sequelize');
const User = require('./server/models/User');
const sequelize = require('./server/config/database');

async function forcePlainPassword() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        const master = await User.findOne({
            where: Sequelize.or({ roleId: 1 }, { role: 'master' })
        });

        if (master) {
            console.log(`Found Master: ${master.email}`);
            // FORCE PLAIN TEXT PASSWORD
            master.password = '123456';
            master.roleId = 1;
            master.role = 'master';
            await master.save();
            console.log(`✅ Password forced to PLAIN TEXT '123456'`);
        } else {
            const newMaster = await User.create({
                name: 'Master Admin',
                email: 'master@vox2you.com',
                password: '123456', // Plain text
                role: 'master',
                roleId: 1,
                active: true,
                unitId: null
            });
            console.log(`✅ Created New Master with PLAIN TEXT '123456': ${newMaster.email}`);
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

forcePlainPassword();
