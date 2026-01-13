require('dotenv').config();
const { sequelize } = require('./models/index');
const User = require('./models/User');

async function verifyMaster() {
    try {
        await sequelize.authenticate();
        console.log("🔍 Verifying Master User...");

        const user = await User.findOne({ where: { email: 'admin@vox2you.com.br' } });

        if (!user) {
            console.log("❌ User NOT FOUND!");
        } else {
            console.log("✅ User FOUND:");
            console.log(`   ID: ${user.id} (Type: ${typeof user.id})`);
            console.log(`   Name: ${user.name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Password: ${user.password}`);
            console.log(`   Role: ${user.role} (ID: ${user.roleId})`);
            console.log(`   Unit: ${user.unit} (unitId: ${user.unitId})`);
            console.log(`   Active: ${user.active}`);
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

verifyMaster();
