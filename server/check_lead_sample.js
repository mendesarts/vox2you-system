const { Lead } = require('./models');
const { Op } = require('sequelize');

async function check() {
    try {
        const sample = await Lead.findOne({ where: { status: 'scheduled' } });
        console.log('Sample Scheduled Lead:', JSON.stringify(sample, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

check();
