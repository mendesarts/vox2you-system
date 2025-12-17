const { Sequelize } = require('sequelize');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    logging: false
});

async function debugAuth() {
    try {
        console.log('🔄 Conectando...');
        await sequelize.authenticate();

        const email = 'novo.admin@voxflow.com';
        const rawPassword = 'Vox2you@2025';

        const [users] = await sequelize.query(
            "SELECT id, email, password FROM \"Users\" WHERE email = :email",
            { replacements: { email } }
        );

        if (users.length === 0) {
            console.log('❌ Usuário não encontrado.');
            return;
        }

        const user = users[0];
        console.log(`👤 Usuário: ${user.email}`);
        console.log(`🔑 Hash no Banco: ${user.password}`);

        // Test 1: StartsWith check
        const startsWithCheck = user.password && user.password.startsWith('$2');
        console.log(`🔍 StartsWith('$2'): ${startsWithCheck}`);

        // Test 2: Compare
        const isMatch = await bcrypt.compare(rawPassword, user.password);
        console.log(`🔐 Bcrypt Compare (Senha: '${rawPassword}'): ${isMatch ? '✅ SUCESSO' : '❌ FALHA'}`);

        // Test 3: Re-Hash and Compare (Verify Library consistency)
        const newHash = await bcrypt.hash(rawPassword, 10);
        console.log(`📝 Novo Hash Gerado (Teste Local): ${newHash}`);
        const isNewMatch = await bcrypt.compare(rawPassword, newHash);
        console.log(`🔐 Teste Local (Hash fresco): ${isNewMatch ? '✅ OK' : '❌ ERRO'}`);

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await sequelize.close();
    }
}

debugAuth();
