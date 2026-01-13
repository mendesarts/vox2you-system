const XLSX = require('xlsx');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// 1. DATABASE CONFIGURATION
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'server', 'voxflow.sqlite'),
    logging: false
});

// 2. MODEL DEFINITIONS
const Lead = sequelize.define('Lead', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: DataTypes.STRING,
    status: DataTypes.TEXT,
    origin_id_importado: DataTypes.STRING,
}, { tableName: 'Leads' });

async function fixStatuses() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        const filePath = path.join(__dirname, 'importado_export_leads_2026-01-07 (1).xlsx');
        console.log(`Reading file: ${filePath}`);

        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        console.log(`Found ${data.length} rows in Excel.`);

        let updatedCount = 0;
        let notFoundCount = 0;

        for (const row of data) {
            const originId = String(row['A'] || row['ID'] || row['origin_id_importado'] || row['id'] || row['Id'] || '');
            // Actually, let's look at the raw keys to find the ID and Status columns
            // Since we use sheet_to_json, keys are column headers.

            // Find ID column
            let idKey = Object.keys(row).find(k => k.toLowerCase().includes('id') && !k.toLowerCase().includes('status'));

            // Explicitly look for 'Etapa do lead'
            let statusKey = Object.keys(row).find(k => k.trim() === 'Etapa do lead');

            if (!statusKey) {
                console.error('Could not find "Etapa do lead" column. Keys available:', Object.keys(row));
                break; // Abort if we can't find the critical column
            }

            // If ID key is missing or not obvious, we might skip. But usually it's the first column.
            if (!idKey) idKey = Object.keys(row)[0];

            // Find auxiliary columns
            const lossReasonKey = Object.keys(row).find(k => k.trim() === 'Motivo de insucesso');
            const saleKey = Object.keys(row).find(k => k.trim() === 'Venda');
            const paymentMethodKey = Object.keys(row).find(k => k.trim() === 'Forma de pagamento');

            const importadoId = String(row[idKey]).trim();
            const rawStatus = String(row[statusKey] || '').trim();
            const lossReason = lossReasonKey ? String(row[lossReasonKey] || '').trim() : '';
            const paymentMethod = paymentMethodKey ? String(row[paymentMethodKey] || '').trim() : '';

            if (!importadoId) continue;

            // DETERMINE CORRECT STATUS - STRICT PRIORITY
            let newStatus = 'new';
            const s = rawStatus.toLowerCase();

            // 1. Payment Method Filled = Won (Sale)
            if (paymentMethod.length > 0) {
                newStatus = 'won';
            }
            // 2. Loss Reason = Closed
            else if (lossReason.length > 0) {
                newStatus = 'closed';
            }
            // 3. 5 Contact Attempts = Closed (Rule from User)
            // Check '*Tentativas de contato*' or if 'Resultado 5º tentativa' is present
            else if (
                String(row['*Tentativas de contato*'] || '').trim() === '5' ||
                String(row['Resultado 5º tentativa'] || '').trim().length > 0
            ) {
                newStatus = 'closed';
            }
            // 4. Status Mapping
            else if (s.includes('novo') || s.includes('new') || s.includes('entrada')) newStatus = 'new';
            else if (s.includes('conectando') || s.includes('ligação') || s.includes('conexão') || s.includes('tentativa')) newStatus = 'connecting';
            else if (s.includes('agenda') || s.includes('entrevista')) newStatus = 'scheduled';
            else if (s.includes('negociação') || s.includes('negotiation')) newStatus = 'negotiation';
            else if (s.includes('bolo') || s.includes('no-show')) newStatus = 'no_show';
            else if (s.includes('won') || s.includes('matriculado') || s.includes('ganho')) newStatus = 'won';
            else if (s.includes('closed') || s.includes('perdido') || s.includes('sem sucesso') || s.includes('encerrado')) newStatus = 'closed';
            else newStatus = 'new'; // Fallback

            // UPDATE DB
            const lead = await Lead.findOne({ where: { origin_id_importado: importadoId } });
            if (lead) {
                if (lead.status !== newStatus) {
                    await lead.update({ status: newStatus });
                    updatedCount++;
                    // console.log(`Updated lead ${importadoId} (${lead.name}): ${rawStatus} -> ${newStatus}`);
                }
            } else {
                notFoundCount++;
            }
        }

        console.log('------------------------------------------------');
        console.log(`Process Complete.`);
        console.log(`Total Rows Processed: ${data.length}`);
        console.log(`Leads Updated: ${updatedCount}`);
        console.log(`Leads Not Found in DB: ${notFoundCount}`);

    } catch (error) {
        console.error('Fatal Error:', error);
    } finally {
        await sequelize.close();
    }
}

fixStatuses();
