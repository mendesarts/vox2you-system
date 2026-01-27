require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const bcrypt = require('bcryptjs');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'voxflow.sqlite'),
    logging: false
});

// Import models
const User = require('./models/User');
const Unit = require('./models/Unit');
const Lead = require('./models/Lead');
const Task = require('./models/Task');
const Class = require('./models/Class');
const Student = require('./models/Student');
const Course = require('./models/Course');
const Mentorship = require('./models/Mentorship');
const ClassSession = require('./models/ClassSession');
const Attendance = require('./models/Attendance');
const FinancialRecord = require('./models/FinancialRecord');

async function runCompleteTest() {
    console.log('\n🚀 INICIANDO TESTE COMPLETO DO SISTEMA\n');

    try {
        await sequelize.authenticate();
        console.log('✅ Conexão com banco estabelecida\n');

        // 1. CRIAR UNIDADE BRASÍLIA.PLANOPILOTO
        console.log('📍 ETAPA 1: Criando unidade Brasília.PlanoPiloto');
        let planoPilotoUnit = await Unit.findOne({ where: { name: 'Brasília.PlanoPiloto' } });
        if (!planoPilotoUnit) {
            planoPilotoUnit = await Unit.create({
                name: 'Brasília.PlanoPiloto',
                city: 'Brasília',
                state: 'DF',
                active: true
            });
            console.log(`   ✓ Unidade criada: ID ${planoPilotoUnit.id}`);
        } else {
            console.log(`   ✓ Unidade já existe: ID ${planoPilotoUnit.id}`);
        }

        // 2. CRIAR FRANQUEADO TESTE
        console.log('\n👤 ETAPA 2: Criando franqueado teste');
        const franqueadoEmail = 'franqueado.teste@vox2you.com';
        let franqueado = await User.findOne({ where: { email: franqueadoEmail } });

        if (!franqueado) {
            const hashedPassword = await bcrypt.hash('123456', 10);
            franqueado = await User.create({
                name: 'Franqueado Teste',
                email: franqueadoEmail,
                password: hashedPassword,
                role: 'franchisee',
                roleId: 4,
                unitId: planoPilotoUnit.id,
                unit: planoPilotoUnit.name,
                phone: '61999999001',
                active: true
            });
            console.log(`   ✓ Franqueado criado: ${franqueado.name} (ID: ${franqueado.id})`);
        } else {
            console.log(`   ✓ Franqueado já existe: ${franqueado.name} (ID: ${franqueado.id})`);
        }

        // 3. CRIAR COMERCIAL (CONSULTOR)
        console.log('\n💼 ETAPA 3: Criando consultor comercial');
        const consultorEmail = 'consultor.teste@vox2you.com';
        let consultor = await User.findOne({ where: { email: consultorEmail } });

        if (!consultor) {
            const hashedPassword = await bcrypt.hash('123456', 10);
            consultor = await User.create({
                name: 'Consultor Teste',
                email: consultorEmail,
                password: hashedPassword,
                role: 'consultant',
                roleId: 3,
                unitId: planoPilotoUnit.id,
                unit: planoPilotoUnit.name,
                phone: '61999999002',
                active: true
            });
            console.log(`   ✓ Consultor criado: ${consultor.name} (ID: ${consultor.id})`);
        } else {
            console.log(`   ✓ Consultor já existe: ${consultor.name} (ID: ${consultor.id})`);
        }

        // 4. CRIAR 3 LEADS FICTÍCIOS
        console.log('\n📋 ETAPA 4: Criando 3 leads fictícios');
        const leadsData = [
            {
                name: 'João Silva Santos',
                phone: '61987654321',
                email: 'joao.silva@email.com',
                source: 'Instagram',
                status: 'new',
                temperature: 'warm',
                courseInterest: 'Master 3.0'
            },
            {
                name: 'Maria Oliveira Costa',
                phone: '61987654322',
                email: 'maria.oliveira@email.com',
                source: 'Google Ads',
                status: 'new',
                temperature: 'hot',
                courseInterest: 'Master 3.0'
            },
            {
                name: 'Pedro Souza Lima',
                phone: '61987654323',
                email: 'pedro.souza@email.com',
                source: 'Indicação',
                status: 'new',
                temperature: 'cold',
                courseInterest: 'Master 3.0'
            }
        ];

        const createdLeads = [];
        for (const leadData of leadsData) {
            let lead = await Lead.findOne({ where: { phone: leadData.phone } });
            if (!lead) {
                lead = await Lead.create({
                    ...leadData,
                    consultant_id: consultor.id,
                    unitId: planoPilotoUnit.id,
                    funnel: 'crm',
                    attemptCount: 0,
                    history: JSON.stringify([{
                        date: new Date().toISOString(),
                        action: 'Lead criado no sistema',
                        user: consultor.name
                    }])
                });
                console.log(`   ✓ Lead criado: ${lead.name} (ID: ${lead.id})`);
            } else {
                console.log(`   ✓ Lead já existe: ${lead.name} (ID: ${lead.id})`);
            }
            createdLeads.push(lead);
        }

        // 5. PROCESSAR PRIMEIRO LEAD (João Silva) - JORNADA COMPLETA
        console.log('\n🎯 ETAPA 5: Processando jornada completa do lead João Silva');
        const mainLead = createdLeads[0];

        // 5.1 Ligação Atendida
        console.log('   📞 Registrando ligação atendida...');
        const callDate = new Date();
        mainLead.status = 'connecting';
        mainLead.lastContactAt = callDate;
        mainLead.attemptCount = 1;
        mainLead.connection_done = true;
        mainLead.connection_date = callDate;
        mainLead.connection_channel = 'phone';

        const history = JSON.parse(mainLead.history || '[]');
        history.push({
            date: callDate.toISOString(),
            action: `Ligação atendida em: ${callDate.toLocaleString('pt-BR')}`,
            user: consultor.name,
            details: 'Cliente demonstrou interesse no curso Master 3.0'
        });
        mainLead.history = JSON.stringify(history);
        await mainLead.save();
        console.log(`   ✓ Ligação registrada: ${callDate.toLocaleString('pt-BR')}`);

        // 5.2 Agendamento de Reunião
        console.log('   📅 Agendando reunião...');
        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() + 2);
        appointmentDate.setHours(14, 0, 0, 0);

        mainLead.status = 'scheduled';
        mainLead.appointmentDate = appointmentDate;

        history.push({
            date: new Date().toISOString(),
            action: `Agendado em: ${appointmentDate.toLocaleString('pt-BR')}`,
            user: consultor.name,
            details: 'Reunião agendada para apresentação do curso'
        });
        mainLead.history = JSON.stringify(history);
        await mainLead.save();
        console.log(`   ✓ Reunião agendada para: ${appointmentDate.toLocaleString('pt-BR')}`);

        // 5.3 Matrícula
        console.log('   🎓 Realizando matrícula...');
        const enrollmentDate = new Date();
        enrollmentDate.setDate(enrollmentDate.getDate() + 3);

        mainLead.status = 'won';

        history.push({
            date: enrollmentDate.toISOString(),
            action: `Matriculado em: ${enrollmentDate.toLocaleString('pt-BR')}`,
            user: consultor.name,
            details: 'Matrícula confirmada - Curso Master 3.0'
        });
        mainLead.history = JSON.stringify(history);
        await mainLead.save();
        console.log(`   ✓ Matrícula registrada: ${enrollmentDate.toLocaleString('pt-BR')}`);

        // 6. CRIAR CURSO MASTER 3.0
        console.log('\n📚 ETAPA 6: Criando curso Master 3.0');
        let masterCourse = await Course.findOne({ where: { name: 'Master 3.0' } });
        if (!masterCourse) {
            masterCourse = await Course.create({
                name: 'Master 3.0',
                description: 'Curso avançado de inglês - Nível Master',
                duration: 48,
                level: 'advanced',
                active: true
            });
            console.log(`   ✓ Curso criado: ${masterCourse.name} (ID: ${masterCourse.id})`);
        } else {
            console.log(`   ✓ Curso já existe: ${masterCourse.name} (ID: ${masterCourse.id})`);
        }

        // 7. CRIAR TURMA FICTÍCIA
        console.log('\n👥 ETAPA 7: Criando turma fictícia');
        const className = 'Master 3.0 - Turma Teste 2026';
        let testClass = await Class.findOne({ where: { name: className } });

        if (!testClass) {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 6);

            testClass = await Class.create({
                name: className,
                courseId: masterCourse.id,
                unitId: planoPilotoUnit.id,
                professorId: franqueado.id,
                startDate: startDate,
                endDate: endDate,
                schedule: 'Segunda e Quarta, 19:00-21:00',
                capacity: 10,
                status: 'active',
                level: 'advanced'
            });
            console.log(`   ✓ Turma criada: ${testClass.name} (ID: ${testClass.id})`);
        } else {
            console.log(`   ✓ Turma já existe: ${testClass.name} (ID: ${testClass.id})`);
        }

        // 8. MATRICULAR ALUNO NA TURMA
        console.log('\n🎓 ETAPA 8: Matriculando aluno na turma');
        let student = await Student.findOne({ where: { name: mainLead.name } });

        if (!student) {
            student = await Student.create({
                name: mainLead.name,
                email: mainLead.email,
                phone: mainLead.phone,
                cpf: '111.444.777-35', // CPF válido
                birthDate: '1995-05-15',
                classId: testClass.id,
                unitId: planoPilotoUnit.id,
                leadId: mainLead.id,
                enrollmentDate: enrollmentDate,
                status: 'active',
                paymentStatus: 'pending',
                address: 'Rua Teste, 123',
                neighborhood: 'Plano Piloto',
                city: 'Brasília',
                state: 'DF',
                cep: '70000-000'
            });
            console.log(`   ✓ Aluno matriculado: ${student.name} (ID: ${student.id})`);
        } else {
            console.log(`   ✓ Aluno já matriculado: ${student.name} (ID: ${student.id})`);
        }

        // 9. CRIAR LANÇAMENTO FINANCEIRO DA MATRÍCULA
        console.log('\n💰 ETAPA 9: Criando lançamento financeiro da matrícula');
        const enrollmentValue = 5000.00;
        const installments = 12;
        const installmentValue = enrollmentValue / installments;

        let financialRecordsCreated = 0;
        for (let i = 1; i <= installments; i++) {
            const dueDate = new Date(enrollmentDate);
            dueDate.setMonth(dueDate.getMonth() + i);
            dueDate.setDate(5);

            const existingRecord = await FinancialRecord.findOne({
                where: {
                    description: `Mensalidade ${i}/${installments} - ${student.name}`,
                    studentId: student.id
                }
            });

            if (!existingRecord) {
                await FinancialRecord.create({
                    description: `Mensalidade ${i}/${installments} - ${student.name}`,
                    amount: installmentValue,
                    dueDate: dueDate,
                    direction: 'income',
                    category: 'Mensalidade',
                    status: 'pending',
                    scope: 'business',
                    unitId: planoPilotoUnit.id,
                    studentId: student.id,
                    classId: testClass.id
                });
                financialRecordsCreated++;
            }
        }
        console.log(`   ✓ ${financialRecordsCreated} parcelas criadas de R$ ${installmentValue.toFixed(2)}`);

        // 10. CRIAR SESSÕES DE AULA
        console.log('\n📖 ETAPA 10: Criando sessões de aula');
        const totalSessions = 48;
        let sessionsCreated = 0;

        for (let i = 1; i <= totalSessions; i++) {
            const sessionDate = new Date(testClass.startDate);
            // Aulas às segundas e quartas
            const daysToAdd = Math.floor((i - 1) / 2) * 7 + ((i - 1) % 2) * 2;
            sessionDate.setDate(sessionDate.getDate() + daysToAdd);

            const existingSession = await ClassSession.findOne({
                where: {
                    classId: testClass.id,
                    sessionNumber: i
                }
            });

            if (!existingSession) {
                await ClassSession.create({
                    classId: testClass.id,
                    sessionNumber: i,
                    date: sessionDate,
                    topic: `Módulo ${Math.ceil(i / 4)} - Aula ${i}`,
                    status: 'scheduled'
                });
                sessionsCreated++;
            }
        }
        console.log(`   ✓ ${sessionsCreated} sessões de aula criadas`);

        // 11. MARCAR PRESENÇA NAS AULAS (COM 2 FALTAS CONSECUTIVAS)
        console.log('\n✅ ETAPA 11: Marcando presenças (incluindo 2 faltas consecutivas)');
        const sessions = await ClassSession.findAll({
            where: { classId: testClass.id },
            order: [['sessionNumber', 'ASC']],
            limit: 10
        });

        let attendancesMarked = 0;
        for (let i = 0; i < sessions.length; i++) {
            const session = sessions[i];
            // Faltar nas aulas 5 e 6 (consecutivas)
            const isPresent = !(i === 4 || i === 5);

            const existingAttendance = await Attendance.findOne({
                where: {
                    studentId: student.id,
                    sessionId: session.id
                }
            });

            if (!existingAttendance) {
                await Attendance.create({
                    studentId: student.id,
                    sessionId: session.id,
                    classId: testClass.id,
                    date: session.date,
                    status: isPresent ? 'present' : 'absent'
                });
                attendancesMarked++;
            }

            // Atualizar status da sessão
            session.status = 'completed';
            await session.save();
        }
        console.log(`   ✓ ${attendancesMarked} presenças marcadas (incluindo 2 faltas consecutivas)`);

        // 12. CRIAR E CONCLUIR 2 MENTORIAS
        console.log('\n🎯 ETAPA 12: Criando e concluindo 2 mentorias');
        const mentorshipsData = [
            {
                date: new Date(),
                topic: 'Revisão de gramática avançada',
                notes: 'Trabalhamos phrasal verbs e expressões idiomáticas. Aluno demonstrou boa evolução.',
                duration: 60
            },
            {
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                topic: 'Conversação e pronúncia',
                notes: 'Focamos em redução de sotaque e fluência. Excelente progresso na pronúncia.',
                duration: 60
            }
        ];

        let mentorshipsCreated = 0;
        for (const mentorshipData of mentorshipsData) {
            const existing = await Mentorship.findOne({
                where: {
                    studentId: student.id,
                    topic: mentorshipData.topic
                }
            });

            if (!existing) {
                await Mentorship.create({
                    studentId: student.id,
                    professorId: franqueado.id,
                    classId: testClass.id,
                    date: mentorshipData.date,
                    topic: mentorshipData.topic,
                    notes: mentorshipData.notes,
                    duration: mentorshipData.duration,
                    status: 'completed'
                });
                mentorshipsCreated++;
            }
        }
        console.log(`   ✓ ${mentorshipsCreated} mentorias criadas e concluídas`);

        // 13. VERIFICAR ALUNO EM RISCO
        console.log('\n⚠️  ETAPA 13: Verificando status de aluno em risco');
        const absences = await Attendance.count({
            where: {
                studentId: student.id,
                status: 'absent'
            }
        });

        const totalAttendances = await Attendance.count({
            where: { studentId: student.id }
        });

        const attendanceRate = totalAttendances > 0 ? ((totalAttendances - absences) / totalAttendances) * 100 : 100;
        console.log(`   ℹ️  Taxa de presença: ${attendanceRate.toFixed(1)}%`);
        console.log(`   ℹ️  Faltas: ${absences} de ${totalAttendances} aulas`);

        if (attendanceRate < 75) {
            console.log(`   ⚠️  ALUNO EM RISCO detectado (presença < 75%)`);
        } else {
            console.log(`   ✓ Aluno com frequência adequada`);
        }

        // 14. FINALIZAR CURSO E TURMA
        console.log('\n🎓 ETAPA 14: Finalizando curso do aluno e turma');
        student.status = 'inactive';
        student.completionDate = new Date();
        await student.save();
        console.log(`   ✓ Aluno marcado como inativo (curso concluído)`);

        testClass.status = 'completed';
        await testClass.save();
        console.log(`   ✓ Turma marcada como concluída`);

        // RESUMO FINAL
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMO DO TESTE COMPLETO');
        console.log('='.repeat(60));
        console.log(`\n✅ Unidade: ${planoPilotoUnit.name} (ID: ${planoPilotoUnit.id})`);
        console.log(`✅ Franqueado: ${franqueado.name} (${franqueado.email})`);
        console.log(`✅ Consultor: ${consultor.name} (${consultor.email})`);
        console.log(`✅ Leads criados: ${createdLeads.length}`);
        console.log(`✅ Lead processado: ${mainLead.name}`);
        console.log(`   - Ligação atendida: ${callDate.toLocaleString('pt-BR')}`);
        console.log(`   - Reunião agendada: ${appointmentDate.toLocaleString('pt-BR')}`);
        console.log(`   - Matriculado: ${enrollmentDate.toLocaleString('pt-BR')}`);
        console.log(`✅ Aluno: ${student.name} (ID: ${student.id})`);
        console.log(`✅ Turma: ${testClass.name}`);
        console.log(`✅ Parcelas financeiras: ${installments}x de R$ ${installmentValue.toFixed(2)}`);
        console.log(`✅ Aulas marcadas: ${attendancesMarked} (2 faltas consecutivas)`);
        console.log(`✅ Taxa de presença: ${attendanceRate.toFixed(1)}%`);
        console.log(`✅ Mentorias concluídas: 2`);
        console.log(`✅ Status final: Aluno e turma INATIVOS (concluídos)`);
        console.log('\n' + '='.repeat(60));
        console.log('🎉 TESTE COMPLETO FINALIZADO COM SUCESSO!');
        console.log('='.repeat(60) + '\n');

        console.log('📝 CREDENCIAIS DE ACESSO:');
        console.log(`   Franqueado: ${franqueadoEmail} / 123456`);
        console.log(`   Consultor: ${consultorEmail} / 123456\n`);

    } catch (error) {
        console.error('\n❌ ERRO NO TESTE:', error);
        console.error(error.stack);
    } finally {
        await sequelize.close();
    }
}

runCompleteTest();
