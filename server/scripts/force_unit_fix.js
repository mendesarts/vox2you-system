const { Sequelize } = require('sequelize');

// TARGET: NEON DB
const NEON_URL = "postgresql://neondb_owner:npg_Z0nhGM3LBOjQ@ep-withered-mountain-ahhvk6ww-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

const sequelize = new Sequelize(NEON_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

async function forceDiagnosis() {
    console.log("🔍 DIAGNÓSTICO PROFUNDO DE UNIDADES E USUÁRIOS...");

    try {
        // 1. Listar todas as Unidades
        const [units] = await sequelize.query('SELECT id, name FROM "Units"');
        console.log("\n🏢 UNIDADES EXISTENTES:");
        console.table(units);

        // 2. Listar Usuários e suas Unidades vinculadas
        const [users] = await sequelize.query(`
            SELECT id, name, email, role, "unitId" 
            FROM "Users" 
            WHERE role IN ('franqueado', 'manager', 'consultor', 'pedagogico')
        `);
        console.log("\n👤 USUÁRIOS (Staff):");
        console.table(users);

        // 3. Contagem de Alunos por ID de Unidade
        const [counts] = await sequelize.query(`
            SELECT "unitId", COUNT(*) as total 
            FROM "Students" 
            GROUP BY "unitId"
        `);
        console.log("\n🎓 ALUNOS POR UNIDADE (Distribuição Atual):");
        console.table(counts);

        // 4. Correção RADICAL
        // Se a unidade alvo for ID 1, vamos garantir que ela NÃO seja tratada como Master na lógica do frontend (alguns sistemas tratam ID 1 como master global)
        // Mas vamos mover todos os alunos para a PRIMEIRA unidade válida encontrada que NÃO seja a Master padrão (se houver).

        let targetId = 1;
        // Se houver uma unidade chamada "Brasília" ou "Águas", pegue o ID dela.
        const specificUnit = units.find(u => u.name.match(/Brasília|Águas|Aguas/i));
        if (specificUnit) {
            targetId = specificUnit.id;
        }

        console.log(`\n🎯 FORÇANDO TODOS OS ALUNOS PARA A UNIDADE ID: ${targetId} (${specificUnit ? specificUnit.name : 'Fallback'})`);

        await sequelize.query(`UPDATE "Students" SET "unitId" = ${targetId}`);
        await sequelize.query(`UPDATE "Leads" SET "unitId" = ${targetId}`);
        await sequelize.query(`UPDATE "Users" SET "unitId" = ${targetId} WHERE role != 'admin_master'`); // Move também a equipe para a mesma unidade

        console.log("✅ UPDATE GLOBAL EXECUTADO.");

    } catch (error) {
        console.error("❌ Erro:", error);
    } finally {
        await sequelize.close();
    }
}

forceDiagnosis();
