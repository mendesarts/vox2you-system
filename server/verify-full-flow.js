const term = require('terminal-kit').terminal;
const sequelize = require('./config/database');
const Lead = require('./models/Lead');
const Student = require('./models/Student');
const Class = require('./models/Class');
const Course = require('./models/Course');
const FinancialRecord = require('./models/FinancialRecord');
const Attendance = require('./models/Attendance');
const Mentorship = require('./models/Mentorship');
const User = require('./models/User');
const Unit = require('./models/Unit');

// Helper CPF
function generateCPF() {
    const rnd = (n) => Math.round(Math.random() * n);
    const mod = (dividend, divisor) => Math.round(dividend - (Math.floor(dividend / divisor) * divisor));
    const n1 = rnd(9); const n2 = rnd(9); const n3 = rnd(9);
    const n4 = rnd(9); const n5 = rnd(9); const n6 = rnd(9);
    const n7 = rnd(9); const n8 = rnd(9); const n9 = rnd(9);
    let d1 = n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10;
    d1 = 11 - (mod(d1, 11)); if (d1 >= 10) d1 = 0;
    let d2 = d1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11;
    d2 = 11 - (mod(d2, 11)); if (d2 >= 10) d2 = 0;
    return `${n1}${n2}${n3}.${n4}${n5}${n6}.${n7}${n8}${n9}-${d1}${d2}`;
}

async function runFullSystemTest() {
    try {
        term.clear();
        term.bold.cyan('🚀 INICIANDO TESTE DE FLUXO COMPLETO DO SISTEMA VOX2YOU\n\n');

        // 0. Setup Context
        const unit = await Unit.findOne();
        const consultant = await User.findOne({ where: { role: 'consultant' } });
        const course = await Course.findOne({ where: { name: 'Academy' } });
        const classTarget = await Class.findOne({ where: { courseId: course.id } }); // Turma Alpha
        const professor = await require('./models/Professor').findOne({ where: { id: classTarget.professorId } });

        if (!unit || !classTarget) {
            throw new Error('Dados base (Unidade/Turma) não encontrados. Rode o setup-db.js primeiro.');
        }

        // --- FASE 1: CHEGADA DO LEAD (CRM) ---
        term.magenta('--- FASE 1: AQUISIÇÃO E CRM ---\n');

        // 1.1 Criar Lead
        const lead = await Lead.create({
            name: 'Aluno Teste Fluxo',
            phone: '11999998888',
            email: 'teste.fluxo@email.com',
            source: 'Simulação',
            status: 'new',
            handledBy: 'AI',
            unitId: unit.id,
            campaign: 'Teste Automatizado'
        });
        term.green(`✅ Lead Criado: ${lead.name} (Status: ${lead.status})\n`);

        // 1.2 Interação IA (Simulação)
        await new Promise(r => setTimeout(r, 500)); // Fake delay
        term.gray('🤖 IA: "Olá, tenho interesse no curso."\n');
        await lead.update({ status: 'qualifying_ia' });
        term.green(`✅ Lead moveu para: Qualificação IA\n`);

        // 1.3 Handover para Humano
        await lead.update({
            handledBy: 'HUMAN',
            consultantId: consultant.id,
            status: 'negotiation'
        });
        term.green(`✅ Handover para Consultor: ${consultant.name} assumiu e moveu para Negociação\n`);


        // --- FASE 2: MATRÍCULA E FINANCEIRO ---
        term.magenta('\n--- FASE 2: FECHAMENTO E MATRÍCULA ---\n');

        // 2.1 Fechamento
        await lead.update({ status: 'won' });
        term.green(`✅ CRM: Lead Ganho/Fechado!\n`);

        // 2.2 Criar Aluno
        const student = await Student.create({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            cpf: generateCPF(), // Usar gerador válido
            status: 'active',
            leadId: lead.id,
            classId: classTarget.id,
            courseId: course.id,
            unitId: unit.id, // Vinculado a mesma unidade
            contractStatus: 'signed'
        });
        term.green(`✅ Aluno Matriculado: ${student.name} na turma ${classTarget.name}\n`);

        // 2.3 Lançamento Financeiro (Matrícula)
        const fee = await FinancialRecord.create({
            type: 'matricula',
            category: 'Receita de Matrícula',
            direction: 'income',
            amount: 500.00,
            dueDate: new Date(),
            status: 'paid',
            paymentMethod: 'pix',
            studentId: student.id,
            unitId: unit.id,
            description: 'Pagamento Taxa de Matrícula'
        });
        term.green(`✅ Financeiro: R$ ${fee.amount} recebido (Taxa Matrícula)\n`);


        // --- FASE 3: JORNADA ACADÊMICA ---
        term.magenta('\n--- FASE 3: PRESTAÇÃO DE SERVIÇO (AULAS) ---\n');

        // 3.1 Presença em Aula
        const attendance = await Attendance.create({
            studentId: student.id,
            classId: classTarget.id,
            date: new Date(),
            status: 'present',
            notes: 'Aluno participativo.'
        });
        term.green(`✅ Presença Registrada: Aula Normal (Status: ${attendance.status})\n`);

        // 3.2 Mentoria Individual
        if (Mentorship) {
            await Mentorship.create({
                studentId: student.id,
                mentorId: professor.id, // Professor da turma
                scheduledDate: new Date(),
                notes: 'Refinamento de Oratória - Excelente evolução na dicção.',
                status: 'completed'
            });
            term.green(`✅ Mentoria Realizada: Com prof. ${professor.name}\n`);
        }


        // --- FASE 4: CONCLUSÃO ---
        term.magenta('\n--- FASE 4: FORMATURA ---\n');

        // 4.1 Formatura
        await student.update({ status: 'completed' }); // Ou status correspondente a formado
        term.green(`🎉 SUCCESSO: Aluno alterado para status 'Formado/Completed'\n`);

        term.bold.cyan('\n🏁 TESTE DE FLUXO CONCLUÍDO COM SUCESSO! 🏁\n');
        process.exit(0);

    } catch (error) {
        term.red(`❌ ERRO NO TESTE: ${error.message}\n`);
        console.error(error);
        process.exit(1);
    }
}

runFullSystemTest();
