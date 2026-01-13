const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('./config/database');
const User = require('./models/User');

async function restoreMaster() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const email = 'master@voxflow.com.br';
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.error(`User ${email} not found!`);
            return;
        }

        console.log(`Found user: ${user.name} (Current Role: ${user.role}, RoleID: ${user.roleId})`);

        user.role = 'master';
        user.roleId = 1;

        await user.save();

        console.log(`✅ SUCCESS: User ${email} restored to Master (RoleID: 1).`);

    } catch (error) {
        console.error('Error restoring master:', error);
    } finally {
        await sequelize.close();
    }
}

restoreMaster();
