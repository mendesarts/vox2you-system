const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function migrate() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Add 'patent' column if not exists
        await sequelize.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Users' AND column_name = 'patent') THEN
                    ALTER TABLE "Users" ADD COLUMN "patent" VARCHAR(255);
                END IF;
            END
            $$;
        `);

        console.log('Migration successful: Added patent column.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
