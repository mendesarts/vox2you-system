require('dotenv').config();
const { sequelize } = require('./models/index');
const User = require('./models/User');

async function seedMaster() {
    try {
        console.log("🌱 Seeding Master User...");
        // Disable global logging if possible or use specific instance
        sequelize.options.logging = false;
        await sequelize.authenticate();
        await sequelize.sync({ logging: false }); // Ensure tables exist

        const email = 'admin@vox2you.com.br';
        const password = 'Leonardo31!'; // Requested Password

        // Check if exists
        const existing = await User.findOne({ where: { email } });
        if (existing) {
            console.log("⚠️ Master User already exists.");
            console.log(`Login: ${email}`);
            console.log(`Senha: (Existing Password)`); // Can't start it.
            // Reset Password
            await existing.update({ password: password });
            console.log(`Senha RESETADA para: ${password}`);
        } else {
            await User.create({
                name: 'Master Admin',
                email: email,
                password: password, // Plain text supported by auth.js fallback
                role: 'master',
                roleId: 1, // MASTER
                unit: 'Matriz',
                active: true
            });
            console.log("✅ Master User Created!");
            console.log(`Login: ${email}`);
            console.log(`Senha: ${password}`);
        }

    } catch (e) {
        console.error("❌ Seed Failed:", e);
        require('fs').writeFileSync('seed_error.log', e.toString());
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

seedMaster();
