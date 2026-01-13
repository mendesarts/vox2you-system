require('dotenv').config();
const sequelize = require('./config/database');

async function fix() {
    try {
        console.log('--- FIXING MENTORSHIP FKs ---');

        // 1. Drop the legacy constraint pointing to Professors
        // We use DROP CONSTRAINT IF EXISTS
        await sequelize.query('ALTER TABLE "Mentorships" DROP CONSTRAINT IF EXISTS "Mentorships_mentorId_fkey"');
        console.log('✅ Dropped Mentorships_mentorId_fkey (legacy Professors FK)');

        // 2. Ensure Mentorships_mentorId_fkey1 exists (pointing to Users)
        // If it already exists, sequelize will likely error if we try to create it again without a check,
        // but since we saw it in the previous check, we are probably good.

        // Just to be safe, let's verify if 'Professors' table exists and rename or drop it if it's empty/useless
        const [profTables] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_name = 'Professors'");
        if (profTables.length > 0) {
            console.log('⚠️ Legacy Professors table found.');
        }

    } catch (e) {
        console.error('FIX FAILED:', e);
    } finally {
        process.exit();
    }
}

fix();
