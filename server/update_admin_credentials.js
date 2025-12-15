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

async function updateAdmin() {
    try {
        await sequelize.authenticate();
        console.log('📦 Conectado ao banco de dados SQLite.');

        // Find existing admin
        const admin = await User.findOne({ where: { role: 'admin' } });

        if (admin) {
            console.log(`Encontrado admin atual: ${admin.email}`);
            admin.email = 'admin@voxflow.com.br';
            admin.password = 'Leonardo31!';
            await admin.save();
            console.log('✅ Credenciais de Admin atualizadas com sucesso!');
        } else {
            console.log('⚠️ Nenhum admin encontrado. Criando novo...');
            await User.create({
                name: 'Admin Master',
                email: 'admin@voxflow.com.br',
                password: 'Leonardo31!',
                role: 'admin',
                unitId: null
            });
            console.log('✅ Novo Admin criado com sucesso!');
        }

    } catch (error) {
        console.error('❌ Erro ao atualizar admin:', error);
    }
}

updateAdmin();
