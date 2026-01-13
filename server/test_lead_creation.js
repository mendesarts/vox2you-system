const { sequelize, Lead, Unit } = require('./models');

async function testLeadCreation() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');

        const unit = await Unit.findByPk(1);
        if (!unit) {
            console.error('Unit 1 not found! This will cause FK error if we use 1.');
        } else {
            console.log('Unit 1 found:', unit.name);
        }

        console.log('Attempting to create a lead...');

        // Simulate payload from CSV import
        const payload = {
            name: "Test Lead Debug",
            phone: "5511999999999", // Ensure this exists
            unitId: 1, // Franchisee unit
            status: "new",
            source: "Import",
            consultant_id: 2 // Assuming user 2 exists from previous debug
        };

        const lead = await Lead.create(payload);
        console.log('SUCCESS: Lead created with ID:', lead.id);

        // Test with NULL unitId
        console.log('Attempting lead with NULL unitId...');
        const lead2 = await Lead.create({ ...payload, name: "Test Lead Null Unit", phone: "5511888888888", unitId: null });
        console.log('SUCCESS: Lead created with NULL unitId:', lead2.id);

    } catch (error) {
        console.error('CREATION FAILED:', error);
        if (error.original) {
            console.error('SQL Error:', error.original.message);
        }
        if (error.errors) {
            error.errors.forEach(e => console.error(`Validation Error: ${e.message} (${e.type})`));
        }
    } finally {
        await sequelize.close();
    }
}

testLeadCreation();
