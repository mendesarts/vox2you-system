const XLSX = require('xlsx');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'server', 'voxflow.sqlite'),
    logging: false
});

const Lead = sequelize.define('Lead', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    status: { type: DataTypes.TEXT, defaultValue: 'new' },
    origin_id_importado: { type: DataTypes.STRING, unique: true }
}, { tableName: 'Leads' });

async function fixConnectedLeads() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const files = [
            'importado_export_leads_2026-01-07 (1).xlsx',
            'importado_export_leads_2026-01-07 (2).xlsx',
            'importado_export_leads_2026-01-07 (3).xlsx'
        ];

        let updatedCount = 0;

        for (const fileName of files) {
            const filePath = path.join(__dirname, fileName);
            if (!fs.existsSync(filePath)) continue;

            console.log(`Scanning ${fileName}...`);
            const workbook = XLSX.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(sheet);

            for (const row of data) {
                // Identify Key Columns
                const idKey = Object.keys(row).find(k => k.toLowerCase().includes('id') && !k.toLowerCase().includes('status'));
                if (!idKey) continue;
                const importadoId = String(row[idKey]).trim();

                const statusKey = Object.keys(row).find(k => k.trim() === 'Etapa do lead');
                const rawStatus = statusKey ? String(row[statusKey]).trim() : '';

                // Check if stage is explicitly 'Conexão'
                if (rawStatus.toLowerCase().includes('conexão')) {
                    const lead = await Lead.findOne({ where: { origin_id_importado: importadoId } });
                    if (lead && lead.status !== 'connected') {
                        await lead.update({ status: 'connected' });
                        updatedCount++;
                    }
                }
            }
        }

        console.log(`FIX COMPLETE. Moved ${updatedCount} leads to 'connected' status.`);

    } catch (e) {
        console.error('CRITICAL ERROR:', e);
    } finally {
        await sequelize.close();
    }
}

fixConnectedLeads();
