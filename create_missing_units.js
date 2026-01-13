const { Unit, sequelize } = require('./server/models');

async function create() {
    try {
        await sequelize.authenticate();

        const units = [
            { name: 'Brasília.AguasClaras', active: true },
            { name: 'Matriz', active: true }
        ];

        for (const u of units) {
            const [unit, created] = await Unit.findOrCreate({
                where: { name: u.name },
                defaults: u
            });
            console.log(`${u.name}: ${created ? 'Created' : 'Already Exists'} (ID: ${unit.id})`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}
create();
