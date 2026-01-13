/**
 * DEBUG SYNC - VERSÃO CORRIGIDA
 * Especialista em Node.js e Sequelize/SQLite
 */
const sequelize = require('./server/config/database');
const models = require('./server/models');
const { Unit, User, AIConfig, Lead, Student, Course, Class } = models;

async function debugSync() {
    try {
        console.log("🚀 Iniciando Sincronização e Reparo do Banco de Dados...");

        // 1. TRATAMENTO DE FOREIGN KEYS
        // Desativamos para permitir recriação total/alteração sem erros de restrição
        await sequelize.query('PRAGMA foreign_keys = OFF;');
        console.log("🔒 PRAGMA foreign_keys = OFF executado.");

        // 4. ORDEM DE EXECUÇÃO
        // Garantir que Unit e User sejam sincronizados antes de Lead e Student
        const syncOrder = [
            'Unit',
            'User',
            'Course',
            'AIConfig',
            'Class',
            'Student',
            'Lead'
        ];

        console.log("📦 Sincronizando modelos em ordem de dependência...");
        for (const modelName of syncOrder) {
            if (models[modelName]) {
                try {
                    // alter: true tenta migrar a tabela. Em SQLite isso é sensível.
                    await models[modelName].sync({ alter: true });
                    console.log(`✅ ${modelName} sincronizado.`);
                } catch (err) {
                    console.warn(`⚠️ Aviso ao sincronizar ${modelName}: ${err.message}`);
                    await models[modelName].sync(); // Fallback para sync simples
                }
            }
        }

        // Sincroniza o restante dos modelos automaticamente
        for (const name in models) {
            if (!syncOrder.includes(name) && models[name].sync) {
                await models[name].sync({ alter: true }).catch(() => { });
            }
        }

        // 2. CORREÇÃO DE DUPLICIDADE (UNIT)
        // Usando findOrCreate para evitar o erro "id must be unique"
        console.log("🌱 Garantindo existências de Unidades Base...");
        const unitsToSeed = [
            { id: 1, name: 'Matriz - Centro', address: 'Av. Principal, 100' },
            { id: 2, name: 'Filial - Shopping', address: 'Shopping City, Loja 20' }
        ];

        for (const u of unitsToSeed) {
            const [unit, created] = await Unit.findOrCreate({
                where: { id: u.id },
                defaults: u
            });
            if (!created) {
                // Se já existe, apenas atualiza para garantir os dados
                await unit.update(u);
            }
        }
        console.log("✅ Unidades processadas com segurança.");

        // 3. CORREÇÃO DE SINTAXE E BINDING (AIConfig - JULIA)
        console.log("🤖 Configurando Prompt da Julia...");
        const juliaPrompt = `📌 **IDENTIDADE E MISSÃO (JULIA - SDR)**
Você é a **Julia**, assistente virtual e pré-vendedora (SDR) da **VoxFlow**.
Sua missão é engajar visitantes, qualificar leads e agendar consultorias.

**🎯 SEUS OBJETIVOS:**
1. **Conexão:** Ser simpática e acolhedora.
2. **Qualificação:** Descobrir a dor do cliente (Medo de falar em público? Carreira travada? TCC?).
3. **Conversão:** Agendar uma visita/aula experimental. NÃO tente vender o curso direto pelo chat; venda a *visita*.

**💬 DIRETRIZES DE COMUNICAÇÃO:**
- Use português brasileiro natural.
- Use emojis para quebrar o gelo, mas sem exageros.
- Seja breve. Mensagens curtas funcionam melhor no WhatsApp.
- Termine sempre com uma pergunta para manter a conversa viva.

**⛔ O QUE NÃO FAZER:**
- Não invente preços se não souber. Use o Manual de Preços.
- Não prometa resultados milagrosos ("você vai virar o Obama em 1 dia").
- Não seja robótica. Se não entender, peça para reformular.`;

        // O upsert do Sequelize usa parâmetros bindados por baixo dos panos (PreparedStatement)
        // Isso resolve o erro de "unrecognized token" no SQL raw.
        await AIConfig.upsert({
            id: 1,
            systemPrompt: juliaPrompt,
            advisorPrompt: `📌 **IDENTIDADE E MISSÃO (ADVISOR - GESTÃO)**
Você é o **Consultor Estratégico Sênior** da diretoria da VoxFlow.
Sua missão é analisar os dados financeiros e pedagógicos da escola.`,
            knowledgeBase: '[]'
        });
        console.log("✅ AIConfig processada com Prepared Statements.");

        // 1. REATIVAR FOREIGN KEYS
        await sequelize.query('PRAGMA foreign_keys = ON;');
        console.log("🔓 PRAGMA foreign_keys = ON reativado.");

        console.log("\n✨ DEBUG SYNC CONCLUÍDO COM SUCESSO! ✨");
        process.exit(0);

    } catch (error) {
        console.error("\n❌ FALHA CRÍTICA NO DEBUG SYNC:");
        console.error(error);
        // Tenta reativar mesmo no erro
        try { await sequelize.query('PRAGMA foreign_keys = ON;'); } catch (e) { }
        process.exit(1);
    }
}

debugSync();
