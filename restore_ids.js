const { Unit, User, sequelize } = require('./server/models');

async function restore() {
    try {
        await sequelize.authenticate();
        await sequelize.query('PRAGMA foreign_keys = OFF');

        // Restore ID 1 as Matriz
        const unit1 = await Unit.findByPk(1);
        if (unit1) {
            await unit1.update({ name: 'Matriz' });
            console.log('Updated ID 1 to Matriz');
        } else {
            await Unit.create({ id: 1, name: 'Matriz', active: true });
            console.log('Restored ID 1 as Matriz');
        }

        // Restore ID 2 as Brasília.AguasClaras
        const unit2 = await Unit.findByPk(2);
        if (unit2) {
            await unit2.update({ name: 'Brasília.AguasClaras' });
            console.log('Updated ID 2 to Brasília.AguasClaras');
        } else {
            await Unit.create({ id: 2, name: 'Brasília.AguasClaras', active: true });
            console.log('Restored ID 2 as Brasília.AguasClaras');
        }

        // Delete IDs 4 and 5 (duplicates created previously)
        await Unit.destroy({ where: { id: [4, 5] } });
        console.log('Deleted temporary IDs 4 and 5');

        await sequelize.query('PRAGMA foreign_keys = ON');
    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}
restore();
