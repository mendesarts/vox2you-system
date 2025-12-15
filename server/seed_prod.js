const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// Verifica argumento via env
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ ERRO: A variável de ambiente DATABASE_URL é obrigatória.');
    console.log('Uso: DATABASE_URL="url_do_postgres_prod" node seed_prod.js');
    process.exit(1);
}

const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    logging: false
});

const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'sales_leader', 'consultant', 'admin_staff', 'pedagogical'), defaultValue: 'consultant' },
    unitId: { type: DataTypes.UUID, allowNull: true },
    color: { type: DataTypes.STRING, defaultValue: '#05AAA8' },
    active: { type: DataTypes.BOOLEAN, defaultValue: true }
});

async function seedAdmin() {
    try {
        console.log('🔄 Conectando ao Banco de Dados Remoto...');
        await sequelize.authenticate();
        console.log('✅ Conectado!');

        const email = 'novo.admin@voxflow.com';
        const password = 'SenhaTemporaria123!';

        // Hash da senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Check exists
        const exists = await User.findOne({ where: { email } });

        if (exists) {
            console.log(`⚠️ Usuário ${email} já existe. Atualizando senha (HASHED)...`);
            exists.password = hashedPassword;
            exists.role = 'admin';
            await exists.save();
            console.log('✅ Usuário atualizado com sucesso (Senha Hashed).');
        } else {
            console.log(`🆕 Criando novo usuário ${email} com senha HASHED...`);
            await User.create({
                name: 'Novo Admin Prod',
                email: email,
                password: hashedPassword,
                role: 'admin',
                unitId: null
            });
            console.log('✅ Usuário criado com sucesso.');
        }

        // Testar verificação localmente para garantir
        const isMatch = await bcrypt.compare(password, hashedPassword);
        if (isMatch) {
            console.log('🔒 Verificacao de Hash: SUCESSO (A senha bate com o hash)');
        } else {
            console.error('❌ Verificacao de Hash: FALHA');
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await sequelize.close();
    }
}

seedAdmin();
