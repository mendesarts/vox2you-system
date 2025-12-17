const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const path = require('path');
const fetch = require('node-fetch'); // Usando fetch para simular requisição HTTP real
require('dotenv').config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    logging: false
});

async function emergencyResetAndTest() {
    try {
        console.log('--- 1. RESET DE SENHAS (EMERGÊNCIA) ---');
        await sequelize.authenticate();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        // Resetar para TODOS
        await sequelize.query(
            "UPDATE \"Users\" SET password = :password, \"forcePasswordChange\" = false WHERE email IN ('novo.admin@voxflow.com', 'mendesarts@gmail.com')",
            { replacements: { password: hashedPassword } }
        );
        console.log('✅ Senhas resetadas para "123456".');

        console.log('\n--- 2. TESTE DE LOGIN LOCAL (Script -> Cloud Run URL) ---');
        // Testar contra a URL PÚBLICA DE PRODUÇÃO
        const prodUrl = 'https://vox2you-system-978034491078.us-central1.run.app/api/auth/login';

        const users = ['novo.admin@voxflow.com', 'mendesarts@gmail.com'];

        for (const email of users) {
            console.log(`\nTesting: ${email}...`);
            try {
                const response = await fetch(prodUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password: '123456' })
                });

                const data = await response.json();
                console.log(`Status: ${response.status}`);
                if (response.ok) {
                    console.log('✅ Login SUCESSO via Cloud Run!');
                } else {
                    console.log('❌ Login FALHOU via Cloud Run:', data);
                }
            } catch (err) {
                console.log('❌ Erro de Rede:', err.message);
            }
        }

    } catch (e) { console.error(e); } finally { await sequelize.close(); }
}

emergencyResetAndTest();
