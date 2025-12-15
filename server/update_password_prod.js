const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// Verifica argumento via env
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ ERRO: DATABASE_URL necessária.');
    process.exit(1);
}

const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }, // SSL para Neon
    logging: false
});

const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'sales_leader', 'consultant', 'admin_staff', 'pedagogical'), defaultValue: 'consultant' }
});

async function updatePassword() {
    try {
        console.log('🔄 Conectando ao Banco de Dados Neon...');
        await sequelize.authenticate();
        console.log('✅ Conectado!');

        const email = 'novo.admin@voxflow.com';
        const newPassword = 'SenhaSegura_4b5C_VOX_2025!';

        const start = Date.now();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        console.log(`🔑 Hash gerado em ${Date.now() - start}ms`);

        const user = await User.findOne({ where: { email } });

        if (user) {
            user.password = hashedPassword;
            await user.save();
            console.log(`✅ Senha do usuário ${email} atualizada com sucesso para a nova credencial segura.`);
        } else {
            console.error(`❌ Usuário ${email} não encontrado.`);
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await sequelize.close();
    }
}

updatePassword();
