const { FinancialRecord } = require('./models');
const { sequelize } = require('./models');
const { Op } = require('sequelize');
const crypto = require('crypto');

async function cleanAndFix() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados.');

        // Lista de descrições dos registros de teste para excluir
        const testDescriptions = [
            'ALUGUEL SALA', 'CONDOMÍNIO', 'IPTU', 'ÁGUA', 'LUZ', 'INTERNET',
            'TELEFONE', 'CELULAR', 'GÁS', 'SALÁRIO PROFESSORES', 'SALÁRIO SECRETÁRIA',
            'SALÁRIO GERENTE', 'SALÁRIO COORDENADOR', 'INSS', 'FGTS', 'GOOGLE ADS',
            'FACEBOOK ADS', 'INSTAGRAM ADS', 'DESIGNER', 'MATERIAL DIDÁTICO',
            'MATERIAL ESCRITÓRIO', 'MATERIAL LIMPEZA', 'CONTADOR', 'ADVOGADO',
            'LIMPEZA', 'SEGURANÇA', 'MANUTENÇÃO', 'SISTEMA/SOFTWARE', 'LANCHES',
            'RECARGA CAFÉ', 'CARTÃO DE CRÉDITO', 'EMPRESTIMO'
        ];

        console.log('\n🗑️  EXCLUINDO REGISTROS DE TESTE...');

        const deletedCount = await FinancialRecord.destroy({
            where: {
                description: {
                    [Op.in]: testDescriptions
                }
            }
        });

        console.log(`✅ ${deletedCount} registros de teste excluídos`);

        // Agora verificar registros do usuário (como "Aluguel Centrale")
        console.log('\n🔍 VERIFICANDO REGISTROS DO USUÁRIO...');

        const userRecords = await FinancialRecord.findAll({
            where: {
                description: {
                    [Op.notIn]: testDescriptions
                }
            },
            order: [['description', 'ASC'], ['dueDate', 'ASC']]
        });

        console.log(`\n📊 Encontrados ${userRecords.length} registros criados pelo usuário`);

        // Agrupar por descrição para verificar quais precisam de planId
        const groupedByDescription = {};

        for (const record of userRecords) {
            const key = record.description;
            if (!groupedByDescription[key]) {
                groupedByDescription[key] = [];
            }
            groupedByDescription[key].push(record);
        }

        console.log(`\n📋 Grupos de registros do usuário:`);

        let fixed = 0;

        for (const [description, groupRecords] of Object.entries(groupedByDescription)) {
            const isRecurring = groupRecords[0].launchType === 'recorrente';
            const isInstallment = groupRecords.length > 1;

            console.log(`\n  📄 ${description}:`);
            console.log(`     - Quantidade: ${groupRecords.length}`);
            console.log(`     - Tipo: ${groupRecords[0].launchType || 'unico'}`);
            console.log(`     - planId atual: ${groupRecords[0].planId || 'NENHUM'}`);

            // Se é recorrente ou tem múltiplas parcelas, mas não tem planId consistente
            if ((isRecurring || isInstallment) && groupRecords.length > 1) {
                const planIds = [...new Set(groupRecords.map(r => r.planId).filter(Boolean))];

                if (planIds.length === 0 || planIds.length > 1) {
                    // Precisa corrigir - atribuir mesmo planId para todos
                    const newPlanId = crypto.randomUUID();

                    console.log(`     ⚠️  CORRIGINDO: Atribuindo planId único`);

                    for (let i = 0; i < groupRecords.length; i++) {
                        await groupRecords[i].update({
                            planId: newPlanId,
                            installments: groupRecords.length,
                            currentInstallment: i + 1
                        });
                        fixed++;
                    }

                    console.log(`     ✅ planId atribuído: ${newPlanId}`);
                } else {
                    console.log(`     ✅ planId OK`);
                }
            }
        }

        if (fixed > 0) {
            console.log(`\n✨ ${fixed} registros foram corrigidos com planId`);
        } else {
            console.log(`\n✅ Todos os registros do usuário já estão corretos!`);
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

cleanAndFix();
