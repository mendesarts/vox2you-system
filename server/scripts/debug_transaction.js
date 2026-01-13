const { Lead } = require('../models');
const sequelize = require('../config/database');

async function test() {
    const t = await sequelize.transaction();
    try {
        const id = 'TEST_DUP_' + Date.now();
        console.log('Testing ID:', id);

        // 1. Create
        await Lead.create({
            name: 'Test 1', phone: '11999990000', origin_id_importado: id, unitId: 1
        }, { transaction: t });

        console.log('Created 1');

        // 2. Find (Same Value)
        const found = await Lead.findOne({
            where: { origin_id_importado: id },
            transaction: t
        });

        console.log('Found inside T:', found ? found.id : 'NULL');

        if (!found) {
            console.log('CRITICAL: Did not find record created in same transaction!');
            await Lead.create({
                name: 'Test 2', phone: '11999990000', origin_id_importado: id, unitId: 1
            }, { transaction: t });
        } else {
            console.log('Success: Found existing record.');
        }

        // 3. Test Multiple Nulls
        console.log('Testing Multiple Nulls...');
        try {
            await Lead.create({ name: 'Null 1', phone: '111', origin_id_importado: null }, { transaction: t });
            await Lead.create({ name: 'Null 2', phone: '222', origin_id_importado: null }, { transaction: t });
            console.log('Success: Created 2 Nulls');
        } catch (e) {
            console.log('FAIL: Nulls caused validation error?', e.message);
        }

        await t.rollback();
        console.log('Done (Rollback)');
    } catch (e) {
        console.error('FAIL GLOBAL:', e);
        if (t) await t.rollback();
    }
}
test();
