const XLSX = require('xlsx');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'server', 'voxflow.sqlite'),
    logging: false
});

const Lead = sequelize.define('Lead', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    status: DataTypes.TEXT,
    origin_id_importado: DataTypes.STRING
}, { tableName: 'Leads' });

async function verifyConnectionLeads() {
    await sequelize.authenticate();

    const filePath = path.join(__dirname, 'importado_export_leads_2026-01-07 (1).xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    console.log('--- VERIFYING "Conexão" LEADS ---');

    let wrongStatusCount = 0;

    for (const row of data) {
        const stage = (row['Etapa do lead'] || '').trim();

        // Only check leads that ARE 'Conexão' in Excel
        if (stage === 'Conexão') {
            // Find ID key
            let idKey = Object.keys(row).find(k => k.toLowerCase().includes('id') && !k.toLowerCase().includes('status'));
            if (!idKey) idKey = Object.keys(row)[0];
            const kid = String(row[idKey]).trim();

            const dbLead = await Lead.findOne({ where: { origin_id_importado: kid } });

            if (dbLead) {
                if (dbLead.status !== 'connecting') {
                    console.log(`MISMATCH! ID: ${kid} | Excel: ${stage} | DB: ${dbLead.status}`);
                    wrongStatusCount++;
                }
            }
        }
    }

    if (wrongStatusCount === 0) {
        console.log('ALL "Conexão" leads from Excel are correctly in "connecting" status in DB.');
    } else {
        console.log(`FOUND ${wrongStatusCount} leads moved out of Connection!`);
    }

    await sequelize.close();
}

verifyConnectionLeads();
