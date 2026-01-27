const { FinancialRecord } = require('./models');
const { sequelize } = require('./models');
const fs = require('fs');
const path = require('path');

// Manual data extraction from PDF
const expenses = [
    { category: 'ALUGUEL', description: 'ALUGUEL SALA', amount: 4000.00, day: 5 },
    { category: 'ALUGUEL', description: 'CONDOMÍNIO', amount: 500.00, day: 5 },
    { category: 'ALUGUEL', description: 'IPTU', amount: 200.00, day: 5 },
    { category: 'CONTAS', description: 'ÁGUA', amount: 150.00, day: 10 },
    { category: 'CONTAS', description: 'LUZ', amount: 450.00, day: 10 },
    { category: 'CONTAS', description: 'INTERNET', amount: 150.00, day: 10 },
    { category: 'CONTAS', description: 'TELEFONE', amount: 100.00, day: 10 },
    { category: 'CONTAS', description: 'CELULAR', amount: 150.00, day: 10 },
    { category: 'CONTAS', description: 'GÁS', amount: 80.00, day: 10 },
    { category: 'SALÁRIOS', description: 'SALÁRIO PROFESSORES', amount: 15000.00, day: 5 },
    { category: 'SALÁRIOS', description: 'SALÁRIO SECRETÁRIA', amount: 3500.00, day: 5 },
    { category: 'SALÁRIOS', description: 'SALÁRIO GERENTE', amount: 5000.00, day: 5 },
    { category: 'SALÁRIOS', description: 'SALÁRIO COORDENADOR', amount: 4000.00, day: 5 },
    { category: 'ENCARGOS', description: 'INSS', amount: 5500.00, day: 20 },
    { category: 'ENCARGOS', description: 'FGTS', amount: 2200.00, day: 7 },
    { category: 'MARKETING', description: 'GOOGLE ADS', amount: 2000.00, day: 15, amountFeb: 6000.00 },
    { category: 'MARKETING', description: 'FACEBOOK ADS', amount: 1500.00, day: 15, amountFeb: 5500.00 },
    { category: 'MARKETING', description: 'INSTAGRAM ADS', amount: 1000.00, day: 15, amountFeb: 5000.00 },
    { category: 'MARKETING', description: 'DESIGNER', amount: 1500.00, day: 5 },
    { category: 'MATERIAIS', description: 'MATERIAL DIDÁTICO', amount: 800.00, day: 15 },
    { category: 'MATERIAIS', description: 'MATERIAL ESCRITÓRIO', amount: 300.00, day: 15 },
    { category: 'MATERIAIS', description: 'MATERIAL LIMPEZA', amount: 200.00, day: 15 },
    { category: 'SERVIÇOS', description: 'CONTADOR', amount: 800.00, day: 10 },
    { category: 'SERVIÇOS', description: 'ADVOGADO', amount: 500.00, day: 10 },
    { category: 'SERVIÇOS', description: 'LIMPEZA', amount: 1200.00, day: 5 },
    { category: 'SERVIÇOS', description: 'SEGURANÇA', amount: 800.00, day: 5 },
    { category: 'SERVIÇOS', description: 'MANUTENÇÃO', amount: 500.00, day: 20 },
    { category: 'SERVIÇOS', description: 'SISTEMA/SOFTWARE', amount: 1200.00, day: 10 },
    { category: 'LANCHES', description: 'LANCHES', amount: 500.00, day: 15 },
    { category: 'COFFEE', description: 'RECARGA CAFÉ', amount: 120.00, day: 15 },
    { category: 'CARTÃO DE CRÉDITO', description: 'CARTÃO DE CRÉDITO', amount: 7995.00, day: 15 },
    { category: 'DÍVIDAS', description: 'EMPRESTIMO', amount: 10538.00, day: 20 }
];

async function importContas() {
    try {
        await sequelize.authenticate();
        console.log('✅ Conectado ao banco de dados.');

        const records = [];
        const year = 2026;
        const crypto = require('crypto');

        for (const expense of expenses) {
            // Gerar um planId único para cada tipo de despesa recorrente
            const planId = crypto.randomUUID();

            for (let month = 1; month <= 12; month++) {
                // Use special amount for marketing items in Feb-Dec
                let amount = expense.amount;
                if (expense.amountFeb && month >= 2) {
                    amount = expense.amountFeb;
                }

                const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(expense.day).padStart(2, '0')}`;

                records.push({
                    type: 'outros',
                    category: expense.category,
                    direction: 'expense',
                    description: expense.description,
                    amount: amount,
                    dueDate: dueDate,
                    status: 'pending',
                    unitId: 1,
                    scope: 'business',
                    launchType: 'recorrente',
                    periodicity: 'mensal',
                    planId: planId,  // ✅ Adicionar planId para conectar os registros
                    installments: 12,
                    currentInstallment: month
                });
            }
        }

        console.log(`\n📊 Total de registros a importar: ${records.length}`);
        console.log('🔄 Importando...\n');

        let imported = 0;
        for (const record of records) {
            await FinancialRecord.create(record);
            imported++;
            if (imported % 50 === 0) {
                console.log(`  ✓ ${imported} registros importados...`);
            }
        }

        console.log(`\n✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO!`);
        console.log(`✨ ${records.length} contas a pagar foram importadas para 2026.`);

        // Summary
        const totalMonthly = expenses.reduce((sum, e) => {
            let amt = e.amount;
            if (e.amountFeb) amt = e.amountFeb; // Use higher amount for average
            return sum + amt;
        }, 0);

        console.log(`\n💰 Total mensal aproximado: R$ ${totalMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`💰 Total anual aproximado: R$ ${(totalMonthly * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);

    } catch (error) {
        console.error('❌ Erro durante a importação:', error);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

importContas();
