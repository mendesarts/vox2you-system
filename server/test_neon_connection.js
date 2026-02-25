const { Sequelize } = require('sequelize');

const databaseUrl = 'postgresql://neondb_owner:npg_Z0nhGM3LBOjQ@ep-withered-mountain-ahhvk6ww-pooler.c-3.us-east-1.aws.neon.tech/neondb';

async function testConnection() {
    console.log('Testing connection to Neon DB...');
    const sequelize = new Sequelize(databaseUrl, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        },
        logging: false
    });

    try {
        await sequelize.authenticate();
        console.log('✅ Connection to Neon DB successful!');

        const [results] = await sequelize.query("SELECT count(*) as count FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Table count in public schema:', results[0].count);

        // Check for Users
        try {
            const [users] = await sequelize.query('SELECT count(*) as count FROM "Users"');
            console.log('Users count:', users[0].count);
        } catch (e) {
            console.log('Could not count Users (table might not exist yet):', e.message);
        }

    } catch (error) {
        console.error('❌ Unable to connect to Neon DB:', error.message);
    } finally {
        await sequelize.close();
    }
}

testConnection();
