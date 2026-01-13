const sequelize = require('./config/database');
const User = require('./models/User');

async function verify() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connection has been established successfully.');

        // Check if file exists (redundant if authenticate works but good for clarity)
        const fs = require('fs');
        const path = require('path');
        const dbPath = path.join(__dirname, 'voxflow.sqlite');

        if (fs.existsSync(dbPath)) {
            console.log(`✅ Database file found at: ${dbPath}`);
            const stats = fs.statSync(dbPath);
            console.log(`✅ Database size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        } else {
            console.log('❌ Database file NOT found at expected path!');
        }

        const userCount = await User.count();
        console.log(`✅ Users in DB: ${userCount}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        process.exit(1);
    }
}

verify();
