const { Sequelize } = require('sequelize');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    logging: false
});

const JWT_SECRET = 'vox2you-secret-key-change-in-prod'; // Hardcoded in auth.js, checking if env overrides or consistency

async function simulateLoginFlow() {
    try {
        console.log('🏁 INICIANDO SIMULAÇÃO DE FLUXO DE LOGIN (DEBUG)\n');

        // 1. Simular Input
        const inputEmail = 'novo.admin@voxflow.com';
        const inputPassword = 'Vox2you@2025';
        console.log(`📥 Input: Email='${inputEmail}', Password='${inputPassword}'`);

        const cleanEmail = inputEmail.trim();
        const cleanPassword = inputPassword.trim();

        // 2. Conectar e Buscar
        console.log('🔄 Conectando ao Banco...');
        await sequelize.authenticate();

        console.log(`🔎 Buscando usuário: ${cleanEmail}`);
        const [users] = await sequelize.query(
            "SELECT * FROM \"Users\" WHERE email = :email",
            { replacements: { email: cleanEmail } }
        );

        const user = users[0];

        if (!user) {
            console.error('❌ FALHA: Usuário não encontrado no banco.');
            return;
        }
        console.log(`✅ Usuário Encontrado: ID=${user.id}, Role=${user.role}, Name=${user.name}`);
        console.log(`🔑 Hash Armazenado: ${user.password}`);

        // 3. Comparação de Senha logic
        let isValidId = false;

        // Check for password existence to match the fix
        if (user.password && user.password.startsWith('$2')) {
            console.log('ℹ️ Tipo de Senha: Hash Bcrypt detectado.');
            isValidId = await bcrypt.compare(cleanPassword, user.password);
            console.log(`🔐 Resultado Bcrypt: ${isValidId}`);
        } else {
            console.log('ℹ️ Tipo de Senha: Texto Plano (Legado).');
            isValidId = user.password === cleanPassword;
            console.log(`🔐 Resultado Texto Plano: ${isValidId}`);
        }

        if (!isValidId) {
            console.error('❌ FALHA: Senha Incorreta.');
            return;
        }

        // 4. Geração de Token
        console.log('🎫 Gerando Token JWT...');
        if (!JWT_SECRET) {
            console.error('❌ FALHA CRÍTICA: JWT_SECRET indefinido.');
            return;
        }

        try {
            const token = jwt.sign(
                { id: user.id, role: user.role, name: user.name, unitId: user.unitId },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            console.log('✅ SUCESSO! Token Gerado:', token.substring(0, 20) + '...');
        } catch (jwtError) {
            console.error('❌ FALHA NA GERAÇÃO DO TOKEN:', jwtError.message);
        }

    } catch (error) {
        console.error('❌ ERRO GERAL:', error);
    } finally {
        await sequelize.close();
    }
}

simulateLoginFlow();
