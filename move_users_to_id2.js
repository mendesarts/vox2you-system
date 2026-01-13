const { User, sequelize } = require('./server/models');

async function move() {
    try {
        await sequelize.authenticate();
        await User.update({ unitId: 2 }, { where: {} }); // Move everyone to 'Brasília.AguasClaras'
        console.log('Moved all users to Unit ID 2 (Brasília.AguasClaras)');
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}
move();
