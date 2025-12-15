const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Setup simplified Sequelize instance just for this operation
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'voxflow.sqlite'),
    logging: false
});

const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'sales_leader', 'consultant', 'admin_staff', 'pedagogical'), defaultValue: 'consultant' },
    unitId: { type: DataTypes.UUID, allowNull: true }
});

async function forceCreateAdmin() {
    try {
        await sequelize.authenticate();
        console.log('📦 Conectado ao banco de dados SQLite.');

        const email = 'admin@master.com';
        const password = 'master';

        // Check if user exists
        let admin = await User.findOne({ where: { email: email } });

        if (admin) {
            console.log(`Usuário ${email} já existe. Atualizando senha...`);
            admin.password = password;
            admin.role = 'admin'; // Ensure it is admin
            await admin.save();
            console.log('✅ Credenciais atualizadas com sucesso!');
        } else {
            console.log(`Criando novo usuário admin ${email}...`);
            await User.create({
                name: 'Admin Master Force',
                email: email,
                password: password,
                role: 'admin',
                unitId: null
            });
            console.log('✅ Novo Admin criado com sucesso!');
        }

    } catch (error) {
        console.error('❌ Erro ao criar/atualizar admin:', error);
    }
}

forceCreateAdmin();
