const { ClassSession, Class } = require('./models');

async function check() {
    try {
        const session = await ClassSession.findOne({
            include: [{ model: Class }]
        });
        if (session) {
            console.log('Session UnitId:', session.Class?.unitId);
            console.log('Session Full:', JSON.stringify(session, null, 2));
        } else {
            console.log('No sessions found.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

check();
