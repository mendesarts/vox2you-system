const { Unit, sequelize } = require('./server/models');

async function fixName() {
    try {
        await sequelize.authenticate();
        // ID 2 is the one I restored as Brasília.AguasClaras
        const unit = await Unit.findByPk(2);
        if (unit) {
            await unit.update({ name: 'Brasília.ÁguasClaras' });
            console.log('Updated Unit ID 2 name to: Brasília.ÁguasClaras');
        } else {
            console.log('Unit ID 2 not found!');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}
fixName();
