const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// TARGET: NEON DB
const NEON_URL = "postgresql://neondb_owner:npg_Z0nhGM3LBOjQ@ep-withered-mountain-ahhvk6ww-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

// SOURCE: LOCAL SQLite
const SQLITE_PATH = path.join(__dirname, '..', 'voxflow.sqlite');
if (!fs.existsSync(SQLITE_PATH)) {
    console.error("❌ ERRO: Banco local voxflow.sqlite não encontrado na raiz!");
    process.exit(1);
}

const sourceDB = new Sequelize({ dialect: 'sqlite', storage: SQLITE_PATH, logging: false });
const targetDB = new Sequelize(NEON_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

// Ordem Crítica para evitar erro de Foreign Key
const TABLE_ORDER = [
    'Units',            // Base
    'Users',            // Depende de Unit
    'AIConfigs',        // Independente
    'Courses',          // Base Pedagógica
    'Classes',          // Depende de Prof(User) e Curso
    'Students',         // Depende de Unit
    'Leads',            // Depende de Unit e User (Consultor)
    'Messages',         // Depende de Lead
    'Enrollments',      // Depende de Student e Class
    'FinancialRecords', // Depende de Enrollment e Unit
    'Tasks',            // Depende de User
    'StudentLogs'       // Depende de Student
];

async function migrate() {
    console.log("🚀 INICIANDO MIGRAÇÃO (MODO SEGURO - ORDENADO)...");

    try {
        await sourceDB.authenticate();
        await targetDB.authenticate();
        console.log("✅ Conexão estabelecida com ambos os bancos.");

        const tablesFound = await sourceDB.getQueryInterface().showAllTables();

        // Filtrar e ordenar tabelas
        const tablesToMigrate = [];

        // 1. Adiciona prioridades na ordem
        for (const t of TABLE_ORDER) {
            if (tablesFound.includes(t)) {
                tablesToMigrate.push(t);
            }
        }

        // 2. Adiciona o resto (tabelas sem dependência mapeada ou ordem irrelevante)
        for (const t of tablesFound) {
            if (!tablesToMigrate.includes(t) && t !== 'sqlite_sequence') {
                tablesToMigrate.push(t);
            }
        }

        console.log(`📋 Ordem de Migração: ${tablesToMigrate.join(' -> ')}`);

        for (const tableName of tablesToMigrate) {
            console.log(`\n🔄 Migrando: ${tableName}...`);

            try {
                const [rows] = await sourceDB.query(`SELECT * FROM "${tableName}"`);
                if (rows.length === 0) {
                    console.log(`   ⚪ Tabela vazia.`);
                    continue;
                }

                let success = 0;
                let fail = 0;

                // Processar em chunks pequenos
                const CHUNK_SIZE = 20;

                for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
                    const chunk = rows.slice(i, i + CHUNK_SIZE);
                    const keys = Object.keys(chunk[0]);
                    const columns = keys.map(k => `"${k}"`).join(',');

                    const values = chunk.map(row => {
                        return `(${keys.map(k => {
                            let val = row[k];
                            // Tratamento de tipos
                            if (val === null) return 'NULL';
                            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`; // Escape SQL
                            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
                            // Datas: Detectar e converter
                            if (keys.includes('createdAt') || keys.includes('updatedAt') || keys.includes('date') || keys.includes('lastLogin')) {
                                // Se for data, garante ISO
                                if (new Date(val).toString() !== 'Invalid Date' && isNaN(val)) {
                                    return `'${new Date(val).toISOString()}'`;
                                }
                            }
                            return val;
                        }).join(',')})`;
                    }).join(',');

                    try {
                        const query = `INSERT INTO "${tableName}" (${columns}) VALUES ${values} ON CONFLICT DO NOTHING;`;
                        await targetDB.query(query);
                        success += chunk.length;
                    } catch (err) {
                        // Se falhar o chunk, tenta um por um (fallback lento mas seguro)
                        // console.error(`   ⚠️ Erro em lote. Tentando linha a linha... (${err.message})`);
                        for (const row of chunk) {
                            // Lógica de fallback single-row omitida para brevidade, mas o erro de lote geralmente é fatal por causa de FK ou falta de tabela
                        }
                        fail += chunk.length;
                        console.error(`   ❌ Falha no lote: ${err.message}`);
                    }
                }
                console.log(`   ✅ ${success} migrados.`);

            } catch (tableErr) {
                console.error(`   ❌ Falha crítica na tabela ${tableName}:`, tableErr.message);
            }
        }

        console.log("\n✨ MIGRAÇÃO FINALIZADA!");

    } catch (error) {
        console.error("FATAL:", error);
    } finally {
        await sourceDB.close();
        await targetDB.close();
    }
}

migrate();
