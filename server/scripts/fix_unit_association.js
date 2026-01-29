const { Sequelize } = require('sequelize');

// TARGET: NEON DB
const NEON_URL = "postgresql://neondb_owner:npg_Z0nhGM3LBOjQ@ep-withered-mountain-ahhvk6ww-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

const sequelize = new Sequelize(NEON_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

async function fixUnitAssociation() {
    console.log("🔍 Verificando Unidades e Alunos...");

    try {
        // 1. Encontrar ID da Unidade "Brasília / Águas Claras"
        const [units] = await sequelize.query(`
            SELECT id, name FROM "Units" WHERE name ILIKE '%goi%' OR name ILIKE '%aguas%' OR name ILIKE '%clara%'
        `);

        console.log("Unidades encontradas:", units);

        let targetUnitId = null;
        for (const u of units) {
            // Tenta achar a unidade correta (ajuste o nome se necessário)
            if (u.name.includes('Águas') || u.name.includes('Brasília')) {
                targetUnitId = u.id;
                break;
            }
        }

        // Se não achou pelo nome exato, pega a primeira unidade não-master (ID > 1) ou cria logicamente
        if (!targetUnitId && units.length > 0) targetUnitId = units[0].id;

        if (!targetUnitId) {
            console.error("❌ Unidade de destino não encontrada.");
            return;
        }

        console.log(`✅ Unidade Alvo detectada: ID ${targetUnitId}`);

        // 2. Atualizar Alunos "Órfãos" ou associados incorretamente (NULL ou ID 1 se for Master)
        // ATENÇÃO: Se todos devem ir para essa unidade, removemos o filtro WHERE

        const [result] = await sequelize.query(`
            UPDATE "Students" 
            SET "unitId" = ${targetUnitId} 
            WHERE "unitId" IS NULL OR "unitId" = 1
        `);

        // Também atualizar Leads se necessário
        const [leadsResult] = await sequelize.query(`
            UPDATE "Leads" 
            SET "unitId" = ${targetUnitId} 
            WHERE "unitId" IS NULL OR "unitId" = 1
        `);

        console.log(`🎉 Correção aplicada!`);
        // console.log(`   - Alunos movidos: ${result.rowCount}`); // Postgres retorna rowCount em algumas versões do driver

    } catch (error) {
        console.error("Erro ao corrigir unidades:", error);
    } finally {
        await sequelize.close();
    }
}

fixUnitAssociation();
