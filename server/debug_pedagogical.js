const { sequelize, Student, Mentorship, Attendance, Unit } = require('./models');

async function debugPedagogical() {
    try {
        await sequelize.authenticate();
        console.log('Connection established.');

        // Fetch Students
        const students = await Student.findAll({
            attributes: ['id', 'name', 'status', 'unitId', 'paymentStatus'],
            include: [{ model: Unit, attributes: ['name'] }]
        });

        console.log('\n--- STUDENTS DEBUG ---');
        console.log('ID | Name | Status | UnitID | UnitName | Payment');
        students.forEach(s => {
            console.log(`${s.id} | ${s.name} | ${s.status} | ${s.unitId} | ${s.Unit ? s.Unit.name : 'NULL'} | ${s.paymentStatus}`);
        });

        // Fetch Mentorships
        const mentorships = await Mentorship.findAll({
            attributes: ['id', 'status', 'studentId', 'unitId']
        });
        console.log('\n--- MENTORSHIPS DEBUG ---');
        console.log('ID | Status | StudentID | UnitID');
        mentorships.forEach(m => {
            console.log(`${m.id} | ${m.status} | ${m.studentId} | ${m.unitId}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

debugPedagogical();
