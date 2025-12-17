const User = require('./models/User');
const Unit = require('./models/Unit');
const { Op } = require('sequelize');

async function fixMendesUnit() {
    try {
        console.log('Starting data fix for mendesarts@gmail.com...');

        const user = await User.findOne({ where: { email: 'mendesarts@gmail.com' } });
        if (!user) {
            console.error('User mendesarts@gmail.com not found.');
            process.exit(1);
        }

        // Check if Unit "Brasília.ÁguasClaras" exists
        let unit = await Unit.findOne({ where: { name: 'Brasília.ÁguasClaras' } });

        if (!unit) {
            console.log('Unit Brasília.ÁguasClaras not found. Creating...');
            unit = await Unit.create({
                name: 'Brasília.ÁguasClaras',
                city: 'Brasília',
                active: true
            });
            console.log('Unit created with ID:', unit.id);
        } else {
            console.log('Unit found:', unit.id);
        }

        // Update User
        user.unitId = unit.id;
        await user.save();

        console.log(`User ${user.email} updated with unitId ${unit.id}`);

    } catch (error) {
        console.error('Error during data fix:', error);
    } finally {
        process.exit(0);
    }
}

fixMendesUnit();
