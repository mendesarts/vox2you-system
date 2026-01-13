const sequelize = require('./config/database');
const User = require('./models/User');

const syncUser = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // Force sync for User model
        await User.sync({ alter: true });
        console.log('User model sync attempt finished.');

        process.exit(0);
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

syncUser();
