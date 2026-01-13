const Mentorship = require('./models/Mentorship');
const User = require('./models/User');
const Student = require('./models/Student');
const sequelize = require('./config/database');

async function check() {
    try {
        console.log('--- Database Check ---');
        const mentorshipCount = await Mentorship.count();
        console.log('Mentorship count:', mentorshipCount);

        const mentors = await User.findAll({ where: { canMentorship: true }, limit: 5 });
        console.log('Available mentors IDs:', mentors.map(m => m.id));

        const students = await Student.findAll({ limit: 5 });
        console.log('Available students IDs:', students.map(s => s.id));

        // Check table structure via raw query
        const [results] = await sequelize.query("SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'Mentorships'");
        console.log('Mentorships columns:', results);

    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        process.exit();
    }
}

check();
