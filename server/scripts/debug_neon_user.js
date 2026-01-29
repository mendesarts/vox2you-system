const { Sequelize, DataTypes } = require('sequelize');

const NEON_URL = "postgresql://neondb_owner:npg_Z0nhGM3LBOjQ@ep-withered-mountain-ahhvk6ww-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require";

const sequelize = new Sequelize(NEON_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
});

const User = sequelize.define('User', {
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    roleId: DataTypes.INTEGER,
    unitId: DataTypes.INTEGER
});

async function debug() {
    try {
        await sequelize.authenticate();
        console.log("Connected to Neon.");
        const user = await User.findByPk(3);
        console.log("User 3:", user ? user.toJSON() : "Not Found");

        const allUsers = await User.findAll({ attributes: ['id', 'name', 'roleId', 'unitId'] });
        console.log("All Users:", allUsers.map(u => `${u.id}:${u.name}(${u.roleId})`).join(", "));

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await sequelize.close();
    }
}

debug();
