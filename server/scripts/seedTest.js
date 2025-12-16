const sequelize = require('../config/database');
const User = require('../models/User');
const Unit = require('../models/Unit');
const Course = require('../models/Course');
const Class = require('../models/Class');
const Student = require('../models/Student');
const FinancialRecord = require('../models/FinancialRecord');
const Lead = require('../models/Lead');
const Task = require('../models/Task');
const CalendarBlock = require('../models/CalendarBlock');
const bcrypt = require('bcryptjs');

// Ensure associations are loaded if needed (though we use explicit IDs mostly)
require('../models/associations');

async function seedTest() {
    try {
        await sequelize.authenticate();
        console.log('🔗 Conectado ao Banco de Dados.');

        // Sync Schema
        console.log('🔄 Sincronizando Schema...');
        await sequelize.sync({ alter: true });
        console.log('✅ Schema Sincronizado.');

        // 1. Criar Unidade
        let unit = await Unit.findOne({ where: { name: 'Unidade Teste Vox' } });
        if (!unit) {
            unit = await Unit.create({
                name: 'Unidade Teste Vox',
                address: 'Rua dos Testes, 123',
                active: true
            });
            console.log(`🏢 Unidade criada: ${unit.name}`);
        } else {
            console.log(`🏢 Unidade existente: ${unit.name}`);
        }

        // 2. Criar Usuários
        const passwordHash = await bcrypt.hash('Mud@r123', 10);

        const users = [
            { name: 'Franqueado Teste', email: 'franqueado@teste.com', role: 'franchisee', unitId: unit.id },
            { name: 'Gerente Adm', email: 'gerente@teste.com', role: 'manager', unitId: unit.id },
            { name: 'Consultor Top', email: 'sales', emailFull: 'consultor@teste.com', role: 'sales', unitId: unit.id },
            { name: 'Coord Pedagógico', email: 'pedagogico@teste.com', role: 'pedagogical', unitId: unit.id }
        ];

        const createdUsers = {};
        for (const u of users) {
            const email = u.emailFull || u.email;
            let user = await User.findOne({ where: { email } });
            if (!user) {
                user = await User.create({
                    name: u.name,
                    email: email,
                    role: u.role,
                    unitId: u.unitId,
                    password: passwordHash,
                    active: true,
                    forcePasswordChange: false
                });
                console.log(`👤 Usuário criado: ${user.name}`);
            } else {
                console.log(`👤 Usuário existente: ${user.name}`);
            }
            createdUsers[u.role] = user;
        }

        // 3. Pedagógico: Curso, Turma e Alunos
        let course = await Course.findOne({ where: { name: 'Oratória Master' } });
        if (!course) {
            course = await Course.create({
                name: 'Oratória Master',
                category: 'Oratória',
                workload: 60,
                mentorshipsIncluded: 2
            });
        }

        let classObj = await Class.findOne({ where: { name: 'Turma Sábado Manhã' } });
        if (!classObj) {
            console.log('DEBUG: Creating Class with:', {
                professorId: createdUsers['pedagogical']?.id,
                courseId: course?.id,
                unitId: unit?.id
            });
            classObj = await Class.create({
                name: 'Turma Sábado Manhã',
                schedule: 'Sábados 08:00 - 12:00',
                professorId: createdUsers['pedagogical'].id,
                courseId: course.id,
                unitId: unit.id,
                status: 'active',
                startDate: new Date()
            });
            console.log(`📚 Turma criada: ${classObj.name}`);
        }

        // Alunos (Check if exists via email)
        for (let i = 1; i <= 5; i++) {
            const exists = await Student.findOne({ where: { email: `aluno${i}@teste.com` } });
            if (!exists) {
                await Student.create({
                    name: `Aluno Teste ${i}`,
                    email: `aluno${i}@teste.com`,
                    phone: `1199999000${i}`,
                    status: 'active',
                    enrollmentNumber: `MT-${2024000 + i}`,
                    unitId: unit.id,
                    classId: classObj.id,
                    courseId: course.id
                });
            }
        }
        console.log('🎓 Alunos verificados/criados.');

        // 4. Financeiro
        // Just create one to ensure data, duplicate is fine for records usually, but let's avoid spam
        const rec = await FinancialRecord.findOne({ where: { description: 'Mensalidade Aluno 1 - Ref Dez' } });
        if (!rec) {
            await FinancialRecord.create({
                type: 'income',
                category: 'Mensalidade',
                description: 'Mensalidade Aluno 1 - Ref Dez',
                amount: 450.00,
                date: new Date(),
                dueDate: new Date(),
                status: 'paid',
                unitId: unit.id
            });
            await FinancialRecord.create({
                type: 'expense',
                category: 'Infraestrutura',
                description: 'Aluguel Sala Extra',
                amount: 1200.00,
                date: new Date(),
                dueDate: new Date(new Date().setDate(new Date().getDate() + 5)),
                status: 'pending',
                unitId: unit.id
            });
            console.log('💰 Registros financeiros criados.');
        }

        // 5. CRM
        const leadCheck = await Lead.findOne({ where: { phone: '11988887777' } });
        if (!leadCheck) {
            await Lead.create({
                name: 'Lead Interessado',
                phone: '11988887777',
                source: 'Instagram',
                status: 'new',
                handledBy: 'AI',
                unitId: unit.id
            });
        }

        let leadNeg = await Lead.findOne({ where: { phone: '11977776666' } });
        if (!leadNeg) {
            leadNeg = await Lead.create({
                name: 'Lead Negociação',
                phone: '11977776666',
                source: 'Google',
                status: 'negotiation',
                handledBy: 'HUMAN',
                consultantId: createdUsers['sales'].id,
                unitId: unit.id,
                notes: 'Cliente quer desconto à vista.'
            });
        }

        const scheduleDate = new Date();
        scheduleDate.setDate(scheduleDate.getDate() + 2);
        scheduleDate.setHours(14, 0, 0, 0);

        const leadSchedCheck = await Lead.findOne({ where: { phone: '11966665555' } });
        if (!leadSchedCheck) {
            await Lead.create({
                name: 'Lead Agendado',
                phone: '11966665555',
                source: 'Indicação',
                status: 'scheduled',
                appointmentDate: scheduleDate,
                handledBy: 'HUMAN',
                consultantId: createdUsers['sales'].id,
                unitId: unit.id
            });
        }
        console.log('🤝 Leads verificados/criados.');

        // 6. Tarefas
        const taskCheck = await Task.findOne({ where: { title: 'Ligar para Lead Negociação' } });
        if (!taskCheck && leadNeg) {
            await Task.create({
                title: 'Ligar para Lead Negociação',
                description: 'Alinhar desconto e fechar.',
                priority: 'high',
                status: 'pending',
                dueDate: new Date(),
                category: 'commercial',
                userId: createdUsers['sales'].id,
                unitId: unit.id,
                leadId: leadNeg.id
            });
        }


        // 7. Calendário (Bloqueio)
        // Check if block exists? simplified check
        await CalendarBlock.create({
            userId: createdUsers['sales'].id,
            startTime: new Date(new Date().setHours(12, 0, 0, 0)),
            endTime: new Date(new Date().setHours(13, 0, 0, 0)),
            reason: 'Almoço'
        });
        console.log('📅 Tarefas e Bloqueios gerados.');

        console.log('✅ Seed de Teste Concluído com Sucesso!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro no seed:', error);
        process.exit(1);
    }
}

seedTest();
