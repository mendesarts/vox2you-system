const { sequelize, User, Lead, Unit } = require('./models');

async function debugData() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        // 1. Fetch Users to check for inconsistencies
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'roleId', 'unitId'],
            include: [{ model: Unit, attributes: ['name'] }]
        });

        console.log('\n--- USERS DEBUG ---');
        console.log('ID | Name | RoleID | UnitID | UnitName');
        users.forEach(u => {
            console.log(`${u.id} | ${u.name} | ${u.roleId} | ${u.unitId} | ${u.Unit ? u.Unit.name : 'NULL'}`);
        });

        // 2. Fetch Leads to check assignments
        const leads = await Lead.findAll({
            attributes: ['id', 'name', 'unitId', 'consultant_id', 'status'],
            include: [
                { model: Unit, attributes: ['name'] },
                { model: User, as: 'consultant', attributes: ['name', 'roleId', 'unitId'] }
            ]
        });

        console.log('\n--- LEADS DEBUG ---');
        console.log('ID | Name | Status | UnitID (Lead) | UnitName | ConsultantID | ConsultantName | ConsultantUnitID | MATCH?');
        leads.forEach(l => {
            const leadUnit = l.unitId;
            const consultantUnit = l.consultant ? l.consultant.unitId : null;
            let match = 'OK';
            if (leadUnit != consultantUnit) match = 'MISMATCH';
            if (!l.consultant) match = 'NO_CONSULTANT';

            console.log(`${l.id} | ${l.name} | ${l.status} | ${leadUnit} | ${l.Unit ? l.Unit.name : 'NULL'} | ${l.consultant_id} | ${l.consultant ? l.consultant.name : 'NULL'} | ${consultantUnit} | ${match}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

debugData();
