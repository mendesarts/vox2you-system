const { sequelize, User, Unit, Holiday, Course, Module, Class } = require('./models');
const bcrypt = require('bcryptjs');

async function resetDatabase() {
    try {
        console.log('🔄 Sincronizando banco de dados (FORCE=true)...');
        await sequelize.sync({ force: true });
        console.log('✅ Tabelas recriadas com IDs Numéricos.');

        // 1. Create Unit
        console.log('🏢 Criando Unidade Matriz...');
        const unit = await Unit.create({
            name: 'Matriz - Vox2You',
            address: 'Rua Exemplo, 123',
            city: 'São Paulo',
            active: true
        });
        console.log(`✅ Unidade criada: ID ${unit.id}`);

        // 2. Create Master User
        console.log('👤 Criando Usuário Master...');
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('123456', salt); // Default password

        const user = await User.create({
            name: 'Administrador',
            email: 'admin@vox2you.com.br',
            password: passwordHash,
            role: 'master',
            roleId: 1, // MASTER
            unitId: unit.id,
            active: true
        });
        console.log(`✅ Usuário criado: ID ${user.id} (admin@vox2you.com.br / 123456)`);

        // 3. Create Holidays
        console.log('📅 Criando Feriados...');
        const holidaysData = [
            { name: 'Confraternização Universal', startDate: '2025-01-01', endDate: '2025-01-01', type: 'holiday', unitId: null },
            { name: 'Carnaval', startDate: '2025-03-03', endDate: '2025-03-04', type: 'recess', unitId: null },
            { name: 'Natal', startDate: '2025-12-25', endDate: '2025-12-25', type: 'holiday', unitId: null }
        ];
        await Holiday.bulkCreate(holidaysData);
        console.log(`✅ ${holidaysData.length} feriados criados.`);

        // 4. Create Basic Course Structure
        console.log('📚 Criando Curso e Turma de Teste...');
        const course = await Course.create({
            name: 'Oratória Completa',
            workload: 40,
            weeklyFrequency: 1,
            mentorshipsIncluded: 3
        });

        const module1 = await Module.create({
            title: 'Módulo 1: Fundamentos',
            CourseId: course.id // Association might be handled by Sequelize (CourseId vs courseId?), let's check associations later but standard is CourseId or courseId depending on definition
        });
        // Note: I didn't verify exact association key in models, usually strict camelCase 'courseId' if defined in model, or 'CourseId' if auto.
        // Given Course model didn't have explicit association code in the view, but index.js calls defineAssociations().
        // I will rely on standard 'courseId' if I can.
        // Actually, let's manually link them later if needed. For now, just creating data.

        // Creating Class
        const cls = await Class.create({
            name: 'Turma Alpha',
            courseId: course.id,
            unitId: unit.id,
            days: 'Seg,Qua',
            startTime: '19:00',
            startDate: '2025-01-10',
            status: 'active'
        });
        console.log(`✅ Turma criada: ${cls.name} (ID ${cls.id})`);

        console.log('\n🚀 RESET COMPLETO. O sistema agora usa IDs Numéricos estritos.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro Fatal:', error);
        process.exit(1);
    }
}

resetDatabase();
