const { Sequelize } = require('sequelize');
const User = require('./server/models/User');
const sequelize = require('./server/config/database');
const bcrypt = require('bcryptjs');

async function resetMaster() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        // 1. Find the Master User
        const master = await User.findOne({
            where: Sequelize.or(
                { roleId: 1 },
                { role: 'master' }
            )
        });

        if (master) {
            console.log(`\n✅ Usuário Master encontrado: ${master.email}`);

            // 2. Reset Password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123456', salt);

            master.password = hashedPassword;
            master.roleId = 1; // Ensure strict Master ID
            master.role = 'master';
            await master.save();

            console.log(`senha redefinida para: 123456`);
        } else {
            console.log('❌ Nenhum usuário Master encontrado. Criando um novo...');

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('123456', salt);

            const newMaster = await User.create({
                name: 'Master Admin',
                email: 'master@vox2you.com',
                password: hashedPassword,
                role: 'master',
                roleId: 1,
                active: true,
                unitId: null
            });
            console.log(`\n✅ Novo Master Criado:`);
            console.log(`Email: ${newMaster.email}`);
            console.log(`Senha: 123456`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Erro:', error);
        process.exit(1);
    }
}

resetMaster();
