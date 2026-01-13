const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'voxflow.sqlite'),
    logging: false
});

const User = sequelize.define('User', {
    email: DataTypes.STRING,
    role: DataTypes.STRING,
    roleId: DataTypes.INTEGER,
    password: DataTypes.STRING,
    unitId: DataTypes.STRING // Should be UUID string or null
}, { tableName: 'Users' });

async function upgradeUser() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        const email = 'mendesarts@gmail.com';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Leonardo31!', salt);

        const user = await User.findOne({ where: { email } });

        if (user) {
            console.log(`Updating existing user: ${email}`);
            await user.update({
                role: 'master',
                roleId: 1,
                unitId: null, // Global
                password: hashedPassword
            });
            console.log('✅ User updated successfully.');
        } else {
            console.log(`User ${email} not found. Creating new Master...`);
            await User.create({
                name: 'Mendes Arts',
                email: email,
                password: hashedPassword,
                role: 'master',
                roleId: 1,
                unitId: null
            });
            console.log('✅ New Master user created.');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit();
    }
}

upgradeUser();
