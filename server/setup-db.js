const sequelize = require('./config/database');
const Lead = require('./models/Lead');
const AIConfig = require('./models/AIConfig');
const Unit = require('./models/Unit');
const User = require('./models/User');
const FinancialRecord = require('./models/FinancialRecord');
// Pedagogical Models
const Student = require('./models/Student');
const Professor = require('./models/Professor');
const Course = require('./models/Course');
const Class = require('./models/Class');
const Attendance = require('./models/Attendance');
const Mentorship = require('./models/Mentorship');
const Transfer = require('./models/Transfer');

// --- Define Associations ---

// Class -> Course, Professor
Class.belongsTo(Course, { foreignKey: 'courseId' });
Course.hasMany(Class, { foreignKey: 'courseId' });

Class.belongsTo(Professor, { foreignKey: 'professorId' });
Professor.hasMany(Class, { foreignKey: 'professorId' });

// Student -> Class, Course
Student.belongsTo(Class, { foreignKey: 'classId' });
Class.hasMany(Student, { foreignKey: 'classId' });

Student.belongsTo(Course, { foreignKey: 'courseId' }); // Optional direct link
Course.hasMany(Student, { foreignKey: 'courseId' });

// Attendance -> Student, Class
Attendance.belongsTo(Student, { foreignKey: 'studentId' });
Student.hasMany(Attendance, { foreignKey: 'studentId' });

Attendance.belongsTo(Class, { foreignKey: 'classId' });
Class.hasMany(Attendance, { foreignKey: 'classId' });

// Mentorship -> Student, Professor
Mentorship.belongsTo(Student, { foreignKey: 'studentId' });
Student.hasMany(Mentorship, { foreignKey: 'studentId' });

Mentorship.belongsTo(Professor, { as: 'mentor', foreignKey: 'mentorId' });
Professor.hasMany(Mentorship, { foreignKey: 'mentorId' });

// Transfer -> Student, fromClass, toClass
Transfer.belongsTo(Student, { foreignKey: 'studentId' });
Student.hasMany(Transfer, { foreignKey: 'studentId' });

Transfer.belongsTo(Class, { as: 'fromClass', foreignKey: 'fromClassId' });
Transfer.belongsTo(Class, { as: 'toClass', foreignKey: 'toClassId' });


// Helper to generate valid CPF
function generateCPF() {
    const rnd = (n) => Math.round(Math.random() * n);
    const mod = (dividend, divisor) => Math.round(dividend - (Math.floor(dividend / divisor) * divisor));
    const n1 = rnd(9);
    const n2 = rnd(9);
    const n3 = rnd(9);
    const n4 = rnd(9);
    const n5 = rnd(9);
    const n6 = rnd(9);
    const n7 = rnd(9);
    const n8 = rnd(9);
    const n9 = rnd(9);
    let d1 = n9 * 2 + n8 * 3 + n7 * 4 + n6 * 5 + n5 * 6 + n4 * 7 + n3 * 8 + n2 * 9 + n1 * 10;
    d1 = 11 - (mod(d1, 11));
    if (d1 >= 10) d1 = 0;
    let d2 = d1 * 2 + n9 * 3 + n8 * 4 + n7 * 5 + n6 * 6 + n5 * 7 + n4 * 8 + n3 * 9 + n2 * 10 + n1 * 11;
    d2 = 11 - (mod(d2, 11));
    if (d2 >= 10) d2 = 0;
    return `${n1}${n2}${n3}.${n4}${n5}${n6}.${n7}${n8}${n9}-${d1}${d2}`;
}

async function initDb() {
    try {
        await sequelize.authenticate();
        console.log('📦 Conectado ao banco de dados SQLite.');

        await sequelize.query("PRAGMA foreign_keys = OFF");
        await sequelize.sync({ force: true });
        await sequelize.query("PRAGMA foreign_keys = ON");

        console.log('✅ Tabelas (re)criadas com sucesso!');

        // 1. Create Admin User & Units
        const unit1 = await Unit.create({ name: 'Matriz - Centro', address: 'Av. Principal, 100' });
        const unit2 = await Unit.create({ name: 'Filial - Shopping', address: 'Shopping City, Loja 20' });
        console.log('🏢 Unidades criadas.');

        await User.create({
            name: 'Admin Master',
            email: 'admin@voxflow.com',
            password: 'admin',
            role: 'admin',
            color: '#05AAA8',
            unitId: null // Sees everything
        });
        console.log('👑 Admin user created.');

        // 2. Create Courses (Global)
        const course1 = await Course.create({
            name: 'Academy',
            category: 'Oratória',
            workload: 40,
            code: 'ACAD-01'
        });
        const course2 = await Course.create({
            name: 'Vendas Extreme',
            category: 'Vendas',
            workload: 30,
            code: 'VEND-01'
        });
        console.log('📚 Cursos criados.');

        // 3. Create Professors
        const prof1 = await Professor.create({
            name: 'Roberto Cohen',
            email: 'roberto@vox.com',
            phone: '11999991111',
            disciplines: 'Oratória, Persuasão'
        });
        const prof2 = await Professor.create({
            name: 'Ana Vilela',
            email: 'ana@vox.com',
            phone: '11999992222',
            disciplines: 'Vendas, Negociação'
        });
        console.log('👨‍🏫 Professores criados.');

        // 3a. Create Consultants
        const consult1 = await User.create({
            name: 'Lucas Vendas',
            email: 'lucas@voxflow.com',
            password: '123',
            role: 'consultant',
            color: '#F59E0B',
            unitId: unit1.id
        });
        const consult2 = await User.create({
            name: 'Sofia Comercial',
            email: 'sofia@voxflow.com',
            password: '123',
            role: 'consultant',
            color: '#EC4899',
            unitId: unit2.id
        });
        console.log('💼 Consultores criados.');

        // 4. Create Classes
        const class1 = await Class.create({
            name: 'Turma Alpha (Academy)',
            courseId: course1.id,
            professorId: prof1.id,
            capacity: 20,
            status: 'active',
            schedule: 'Seg/Qua 19:00',
            startDate: '2025-01-15',
            unitId: unit1.id
        });

        const class2 = await Class.create({
            name: 'Turma Beta (Vendas)',
            courseId: course2.id,
            professorId: prof2.id,
            capacity: 25,
            status: 'planned',
            schedule: 'Sáb 09:00',
            startDate: '2025-02-10',
            unitId: unit2.id
        });
        console.log('🏫 Turmas criadas.');

        // 5. Create Students
        await Student.create({
            name: 'Carlos Oliveira',
            cpf: generateCPF(),
            birthDate: '1990-05-15',
            email: 'carlos@email.com',
            phone: '11900001234',
            status: 'active',
            classId: class1.id,
            courseId: course1.id,
            contractStatus: 'signed',
            paymentStatus: 'paid',
            unitId: unit1.id
        });

        await Student.create({
            name: 'Fernanda Lima',
            cpf: generateCPF(),
            birthDate: '1995-10-20',
            email: 'fernanda@email.com',
            phone: '11900005678',
            status: 'active',
            classId: class1.id,
            courseId: course1.id,
            contractStatus: 'signed',
            paymentStatus: 'late',
            unitId: unit1.id
        });

        await Student.create({
            name: 'Marcos Souza',
            cpf: generateCPF(),
            birthDate: '1988-03-01',
            email: 'marcos@email.com',
            status: 'locked', // Trancado
            classId: class1.id,
            courseId: course1.id,
            unitId: unit1.id
        });

        await Student.create({
            name: 'Juliana Shopping',
            cpf: generateCPF(),
            birthDate: '2000-01-01',
            email: 'ju@email.com',
            status: 'active',
            classId: class2.id,
            courseId: course2.id,
            unitId: unit2.id
        });
        console.log('🎓 Alunos criados.');


        // 6. Create Leads (Mock)
        await Lead.bulkCreate([
            { name: 'João Silva', phone: '11999999999', source: 'Instagram', status: 'new', campaign: 'Verão 2025', handledBy: 'AI', unitId: unit1.id },
            { name: 'Maria Pereira', phone: '11988888888', source: 'Indicação', status: 'qualifying_ia', campaign: 'Indique e Ganhe', handledBy: 'AI', unitId: unit1.id },
            { name: 'Pedro Fechado', phone: '11977777777', source: 'Google', status: 'won', campaign: 'Institucional', handledBy: 'HUMAN', consultantId: consult1.id, updatedAt: new Date(), unitId: unit1.id },
            { name: 'Ana Contrato', phone: '11966666666', source: 'Passante', status: 'won', campaign: 'Institucional', handledBy: 'HUMAN', consultantId: consult1.id, updatedAt: new Date(), unitId: unit1.id },
            { name: 'Carlos Negociação', phone: '11955555555', source: 'Instagram', status: 'negotiation', campaign: 'Black Friday', handledBy: 'HUMAN', consultantId: consult2.id, updatedAt: new Date(), unitId: unit2.id }
        ]);
        console.log('👤 Leads criados.');

        // 7. Seed AI Config
        await AIConfig.create({
            systemPrompt: `📌 **IDENTIDADE E MISSÃO (JULIA - SDR)**
Você é a **Julia**, assistente virtual da VoxFlow.
Sua missão é engajar visitantes e agendar visitas com simpatia e eficiência.`,
            advisorPrompt: `📌 **IDENTIDADE E MISSÃO (ADVISOR - GESTÃO)**
Você é o **Consultor Estratégico** da VoxFlow.
Analise os dados com rigor e foque no lucro e retenção de alunos.`,
            knowledgeBase: JSON.stringify([{ title: 'Tabela 2024', content: 'Academy: R$ 3500. Vendas: R$ 2200.' }])
        });
        console.log('🤖 AI Config inicializada.');

    } catch (error) {
        console.error('❌ Erro setup DB:', error);
    }
}

initDb();
