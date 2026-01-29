const { Sequelize } = require('sequelize');

// TARGET: NEON DB
const NEON_URL = "postgresql://neondb_owner:npg_Z0nhGM3LBOjQ@ep-withered-mountain-ahhvk6ww-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

const sequelize = new Sequelize(NEON_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

async function fixForeignKeys() {
    console.log("🛠️ Corrigindo Foreign Keys para permitir exclusão (ON DELETE CASCADE)...");

    try {
        const queryInterface = sequelize.getQueryInterface();

        // Lista de tabelas que travam a exclusão de Students
        const constraints = [
            { table: 'Associations', fk: 'studentId' }, // Exemplo genérico
            { table: 'FinancialRecords', fk: 'studentId' },
            { table: 'Enrollments', fk: 'studentId' },
            { table: 'Attendances', fk: 'studentId' },
            { table: 'Mentorships', fk: 'studentId' },
            { table: 'StudentLogs', fk: 'studentId' }
        ];

        // Precisamos descobrir o nome das constraints no Postgres para dropar e recriar
        // Isso é complexo de fazer de forma genérica.
        // Vamos usar uma abordagem mais cirúrgica:
        // Tentar alterar a FK existente se possível, ou instruir o usuário.

        // Mas no Sequelize, o `onDelete: 'CASCADE'` deveria cuidar disso.
        // Se foi criado como RESTRICT (padrão antigo), trava.

        console.log("⚠️ AVISO: Isso requer privilégios elevados. Tentando modo simplificado...");

        // Iterar sobre tabelas filhas comuns
        const childTables = ['FinancialRecords', 'Enrollments', 'Attendances', 'Mentorships', 'StudentLogs', 'Transfers'];

        for (const child of childTables) {
            console.log(`\nVerificando tabela ${child}...`);

            // 1. Descobrir nome da constraint FK para studentId
            const [results] = await sequelize.query(`
                SELECT
                    tc.constraint_name, 
                    kcu.column_name 
                FROM 
                    information_schema.table_constraints AS tc 
                    JOIN information_schema.key_column_usage AS kcu
                      ON tc.constraint_name = kcu.constraint_name
                      AND tc.table_schema = kcu.table_schema
                WHERE constraint_type = 'FOREIGN KEY' 
                  AND tc.table_name='${child}'
                  AND kcu.column_name='studentId';
            `);

            if (results.length > 0) {
                const constraintName = results[0].constraint_name;
                console.log(`   - Constraint encontrada: ${constraintName}`);

                // 2. Drop Constraint
                console.log(`   - Removendo constraint antiga...`);
                await sequelize.query(`ALTER TABLE "${child}" DROP CONSTRAINT "${constraintName}"`);

                // 3. Add Constraint with CASCADE
                console.log(`   - Recriando com ON DELETE CASCADE...`);
                await sequelize.query(`
                    ALTER TABLE "${child}" 
                    ADD CONSTRAINT "${constraintName}" 
                    FOREIGN KEY ("studentId") 
                    REFERENCES "Students" ("id") 
                    ON DELETE CASCADE
                `);
                console.log(`   ✅ Corrigido!`);
            } else {
                console.log(`   ℹ️ Nenhuma FK 'studentId' encontrada ou nome diferente.`);
            }
        }

        console.log("\n✨ Processo de correção de FK concluído.");

    } catch (error) {
        console.error("❌ ERRO FATAL:", error.message);
    } finally {
        await sequelize.close();
    }
}

fixForeignKeys();
