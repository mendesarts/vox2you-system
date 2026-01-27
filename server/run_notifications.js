require('dotenv').config();
const notificationService = require('./services/notificationService');
const sequelize = require('./config/database');

async function runNotifications() {
    console.log('\n🔔 EXECUTANDO SISTEMA DE NOTIFICAÇÕES AUTOMÁTICAS\n');
    console.log('='.repeat(60));

    try {
        await sequelize.authenticate();
        console.log('✅ Conexão com banco estabelecida\n');

        const result = await notificationService.runAllChecks();

        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMO DAS NOTIFICAÇÕES');
        console.log('='.repeat(60));
        console.log(`\n✅ Total de notificações criadas: ${result.total}\n`);

        if (result.students.length > 0) {
            console.log('👨‍🎓 ALUNOS EM RISCO:');
            result.students.forEach((n, i) => {
                console.log(`   ${i + 1}. ${n.student}`);
                console.log(`      Tipo: ${n.type}`);
                console.log(`      ${n.count ? `Faltas: ${n.count}` : `Taxa: ${n.rate}%`}`);
                console.log(`      Responsável: ${n.assignedTo}\n`);
            });
        } else {
            console.log('✅ Nenhum aluno em risco detectado\n');
        }

        if (result.payments.length > 0) {
            console.log('💰 PAGAMENTOS VENCIDOS:');
            result.payments.forEach((n, i) => {
                console.log(`   ${i + 1}. ${n.student}`);
                console.log(`      Parcelas em atraso: ${n.count}`);
                console.log(`      Valor total: R$ ${n.amount.toFixed(2)}`);
                console.log(`      Responsável: ${n.assignedTo}\n`);
            });
        } else {
            console.log('✅ Nenhum pagamento vencido detectado\n');
        }

        console.log('='.repeat(60));
        console.log('🎉 VERIFICAÇÕES CONCLUÍDAS COM SUCESSO!');
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('\n❌ ERRO:', error);
        console.error(error.stack);
    } finally {
        await sequelize.close();
    }
}

runNotifications();
