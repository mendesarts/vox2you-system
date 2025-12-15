const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// Verifica argumento via env
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ ERRO: A variável de ambiente DATABASE_URL é obrigatória.');
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
    role: { type: DataTypes.ENUM('admin', 'consultant'), defaultValue: 'consultant' }
});

async function diagnose() {
    try {
        console.log('🔄 Conectando ao Banco de Dados Remoto...');
        await sequelize.authenticate();
        console.log('✅ Conectado!');

        const email = 'novo.admin@voxflow.com';
        const passwordToCheck = 'SenhaTemporaria123!';

        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.error(`❌ Usuário ${email} NÃO ENCONTRADO no banco.`);
            return;
        }

        console.log(`\n👤 Usuário encontrado: ${user.name} (${user.id})`);
        console.log(`🔑 Hash armazenado (primeiros 10 chars): ${user.password.substring(0, 10)}...`);

        // Verifica formato do hash
        if (!user.password.startsWith('$2')) {
            console.warn('⚠️ AVISO: A senha armazenada NÃO parece ser um hash bcrypt (não começa com $2).');
            console.log('Isso explica o erro se o sistema espera um hash.');
        }

        // Teste de comparação
        console.log(`\n🔍 Testando comparacao com a senha: "${passwordToCheck}"`);
        const isMatch = await bcrypt.compare(passwordToCheck, user.password);

        if (isMatch) {
            console.log('✅ SUCESSO: bcrypt.compare retornou TRUE. A senha e o hash BATEM.');
            console.log('Conclusão: O banco de dados está correto.');
        } else {
            console.error('❌ FALHA: bcrypt.compare retornou FALSE.');
            console.log('Conclusão: A senha fornecida não gera esse hash. Pode ter ocorrido corrupção ou erro na criação.');

            // Generate a sample hash to compare visual differences if needed (though salts explain diffs)
            const sampleSalt = await bcrypt.genSalt(10);
            const sampleHash = await bcrypt.hash(passwordToCheck, sampleSalt);
            console.log(`Exemplo de hash válido para esta senha seria: ${sampleHash.substring(0, 15)}...`);
        }

    } catch (error) {
        console.error('❌ Erro de conexão ou consulta:', error);
    } finally {
        await sequelize.close();
    }
}

diagnose();
