const sequelize = require('../config/database');
const FinancialRecord = require('../models/FinancialRecord');
const Unit = require('../models/Unit');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // Get or Create Unit
        let unit = await Unit.findOne();
        if (!unit) {
            unit = await Unit.create({
                name: 'Unidade Matriz (Teste)',
                city: 'São Paulo',
                active: true
            });
            console.log('Created Default Unit:', unit.name);
        } else {
            console.log('Found Unit:', unit.name);
        }

        const records = [
            {
                type: 'outros',
                category: 'Água',
                direction: 'expense',
                description: 'Conta de Água (Placeholder)',
                amount: 0.00,
                dueDate: new Date(),
                status: 'pending',
                unitId: unit.id
            },
            {
                type: 'outros',
                category: 'Energia',
                direction: 'expense',
                description: 'Conta de Luz (Placeholder)',
                amount: 0.00,
                dueDate: new Date(),
                status: 'paid',
                paymentDate: new Date(),
                unitId: unit.id
            },
            {
                type: 'matricula',
                category: 'Mensalidade',
                direction: 'income',
                description: 'Mensalidade Aluno Teste (Placeholder)',
                amount: 0.00,
                dueDate: new Date(),
                status: 'paid',
                paymentDate: new Date(),
                unitId: unit.id
            }
        ];

        for (const r of records) {
            await FinancialRecord.create(r);
        }

        console.log(`Created ${records.length} dummy financial records successfully.`);

    } catch (err) {
        console.error('Error seeding:', err);
    } finally {
        await sequelize.close();
    }
}

seed();
