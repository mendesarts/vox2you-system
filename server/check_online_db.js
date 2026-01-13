const { Sequelize, DataTypes } = require('sequelize');

const databaseUrl = 'postgresql://neondb_owner:npg_Z0nhGM3LBOjQ@ep-withered-mountain-ahhvk6ww-pooler.c-3.us-east-1.aws.neon.tech/neondb';

const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

const FinancialRecord = sequelize.define('FinancialRecord', {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    type: DataTypes.STRING,
    category: DataTypes.STRING,
    direction: DataTypes.STRING,
    description: DataTypes.STRING,
    amount: DataTypes.DECIMAL(10, 2),
    dueDate: DataTypes.DATEONLY,
    paymentDate: DataTypes.DATEONLY,
    status: DataTypes.STRING,
    unitId: DataTypes.INTEGER,
    studentId: DataTypes.INTEGER
}, { tableName: 'FinancialRecords', timestamps: true });

async function check() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to ONLINE database (Neon).');

        const [tables] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
        console.log('\n--- SCANNING ALL TABLES FOR TODAY\'S UPDATES (2026-01-10/11) ---');

        for (const { table_name } of tables) {
            try {
                const [count] = await sequelize.query(`
                    SELECT COUNT(*) as count 
                    FROM "${table_name}" 
                    WHERE "createdAt" >= '2026-01-10' OR "updatedAt" >= '2026-01-10'
                `);

                if (count[0].count > 0) {
                    console.log(`🚀 Table [${table_name}]: ${count[0].count} recent records found!`);
                    const [records] = await sequelize.query(`
                        SELECT * FROM "${table_name}" 
                        WHERE "createdAt" >= '2026-01-10' OR "updatedAt" >= '2026-01-10' 
                        LIMIT 3
                    `);
                    console.log(JSON.stringify(records, null, 2));
                } else {
                    // console.log(`- ${table_name}: No recent updates.`);
                }
            } catch (e) {
                // Some tables might not have createdAt/updatedAt
                // console.log(`- ${table_name}: Skipped (No timestamps)`);
            }
        }

        console.log('\n--- FINANCIAL TABLE SUMMARY ---');
        const [finCount] = await sequelize.query('SELECT COUNT(*) as total FROM "FinancialRecords"');
        const [finToday] = await sequelize.query('SELECT COUNT(*) as today FROM "FinancialRecords" WHERE "createdAt" >= \'2026-01-10\'');
        console.log(`FinancialRecords Total: ${finCount[0].total}`);
        console.log(`FinancialRecords New/Updated (Jan 10/11): ${finToday[0].today}`);

    } catch (error) {
        console.error('❌ Error connecting to online DB:', error.message);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

check();
