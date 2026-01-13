const { Unit, User, sequelize } = require('./server/models');
const { Op } = require('sequelize');

async function fix() {
    try {
        console.log('Connecting...');
        await sequelize.authenticate();
        await sequelize.query('PRAGMA foreign_keys = OFF');

        // 1. Ensure Target Unit Exists
        let targetUnit = await Unit.findOne({ where: { name: { [Op.like]: '%Guará%' } } });
        if (!targetUnit) {
            console.log('Target unit not found. Creating Brasília.Guará...');
            targetUnit = await Unit.create({ name: 'Brasília.Guará', active: true });
        }
        console.log(`Target Unit: ${targetUnit.name} (ID: ${targetUnit.id})`);

        // 2. Move All Users to Target Unit
        console.log('Moving all users to target unit...');
        await User.update({ unitId: targetUnit.id }, { where: {} });

        // 3. Delete Unwanted Units
        console.log('Deleting unwanted units...');
        const deleted = await Unit.destroy({
            where: {
                id: { [Op.ne]: targetUnit.id }
            }
        });
        console.log(`Deleted ${deleted} old units.`);

        console.log('Fix Complete.');

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
}

fix();
