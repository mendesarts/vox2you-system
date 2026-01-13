const XLSX = require('xlsx');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const fs = require('fs');

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
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    status: { type: DataTypes.TEXT, defaultValue: 'new' },
    handledBy: { type: DataTypes.TEXT, defaultValue: 'HUMAN' },
    origin_id_importado: { type: DataTypes.STRING, unique: true },
    sales_value: DataTypes.FLOAT,
    enrollment_value: DataTypes.FLOAT,
    payment_method: DataTypes.STRING,
    course_interest: DataTypes.STRING,
    neighborhood: DataTypes.STRING,
    profession: DataTypes.STRING,
    loss_reason: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    unitId: { type: DataTypes.INTEGER, defaultValue: 1 },
    consultant_id: DataTypes.INTEGER
}, { tableName: 'Leads' });

const Task = sequelize.define('Task', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    leadId: DataTypes.INTEGER,
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    dueDate: DataTypes.DATE,
    priority: { type: DataTypes.STRING, defaultValue: 'medium' },
    status: { type: DataTypes.STRING, defaultValue: 'pending' },
    category: { type: DataTypes.STRING, defaultValue: 'commercial' },
    unitId: DataTypes.INTEGER,
    userId: DataTypes.INTEGER
}, { tableName: 'Tasks' });

// 3. MAIN IMPORT FUNCTION
async function runImport() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // A. RESET DATABASE
        console.log('--- RESETTING LEADS & COMMERCIAL TASKS ---');
        await Task.destroy({ where: { category: 'commercial' } });
        await Lead.destroy({ where: {}, truncate: true });
        console.log('Database Cleared.');

        // B. FILE LIST
        const files = [
            'importado_export_leads_2026-01-07 (1).xlsx',
            'importado_export_leads_2026-01-07 (2).xlsx',
            'importado_export_leads_2026-01-07 (3).xlsx'
        ];

        let totalProcessed = 0;

        for (const fileName of files) {
            const filePath = path.join(__dirname, fileName);
            if (!fs.existsSync(filePath)) {
                console.warn(`File not found: ${fileName}`);
                continue;
            }

            console.log(`Processing ${fileName}...`);
            const workbook = XLSX.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(sheet);

            console.log(`Found ${data.length} rows.`);

            for (const row of data) {
                // 1. Identify Key Columns
                const idKey = Object.keys(row).find(k => k.toLowerCase().includes('id') && !k.toLowerCase().includes('status'));
                if (!idKey) continue;

                const importadoId = String(row[idKey]).trim();
                const statusKey = Object.keys(row).find(k => k.trim() === 'Etapa do lead');
                const rawStatus = statusKey ? String(row[statusKey]).trim() : '';

                const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('lead') && k.toLowerCase().includes('título') || k.toLowerCase() === 'nome');
                const phoneKey = Object.keys(row).find(k => k.toLowerCase().includes('contato') || k.toLowerCase().includes('fone'));

                // Interaction Check (Any non-empty field related to attempts)
                const hasInteraction = [
                    row['Resultado 1º tentativa'],
                    row['Resultado 2º tentativa'],
                    row['Follow Up 1'],
                    row['*Tentativas de contato*']
                ].some(val => val && String(val).trim().length > 0 && String(val).trim() !== '0');

                // 2. Determine Status - STRICT MAPPING
                let status = 'new';
                const s = rawStatus.toLowerCase();

                if (s.includes('novo') || s.includes('new') || s.includes('entrada')) status = 'new';
                else if (s.includes('conectando') || s.includes('ligação') || s.includes('tentativa') || s.includes('conexão')) status = 'connecting';
                else if (s.includes('agenda') || s.includes('entrevista')) status = 'scheduled';
                else if (s.includes('negociação')) status = 'negotiation';
                else if (s.includes('bolo') || s.includes('no-show')) status = 'no_show';
                else if (s.includes('won') || s.includes('matriculado')) status = 'won';
                else if (s.includes('closed') || s.includes('perdido') || s.includes('encerrado')) status = 'closed';
                else status = 'new'; // Fallback

                // Rule: If 'new' but has interaction -> 'connecting'
                if (status === 'new' && hasInteraction) {
                    status = 'connecting';
                }

                // 3. Prepare Lead Object
                const leadData = {
                    origin_id_importado: importadoId,
                    name: row[nameKey] || 'Lead Sem Nome',
                    phone: row[phoneKey] ? String(row[phoneKey]).replace(/\D/g, '') : '',
                    status: status,
                    unitId: 1, // Default Unit
                    consultant_id: 2, // Default Admin
                    payment_method: row['Forma de pagamento'] || '',
                    loss_reason: row['Motivo de insucesso'] || '',
                    course_interest: row['Curso de Interesse'] || '',
                    createdAt: new Date()
                };

                // 4. Create Only (Since we cleared DB) - but handle duplicates across files
                let lead = await Lead.findOne({ where: { origin_id_importado: importadoId } });

                if (lead) {
                    await lead.update(leadData);
                } else {
                    lead = await Lead.create(leadData);
                }

                // 5. Generate Task for Active Leads (Strict Matching with Kanban)
                if (!['won', 'closed', 'lost', 'archived'].includes(status)) {

                    // Determine Task Title based on Status (Same as Backend)
                    let title = 'Dar Seguimento';
                    if (status === 'scheduled') title = `Reunião: ${leadData.name}`;
                    else if (status === 'connecting') title = `Retentativa: ${leadData.name}`;
                    else if (status === 'negotiation') title = `Negociação: ${leadData.name}`;
                    else if (status === 'no_show') title = `No Show: ${leadData.name}`;
                    else if (status === 'new') title = `Iniciar Conexão: ${leadData.name}`;

                    // Check if task already exists
                    const existingTask = await Task.findOne({ where: { leadId: lead.id, category: 'commercial' } });
                    if (!existingTask) {
                        await Task.create({
                            leadId: lead.id,
                            title: title,
                            description: `Lead importado. Etapa original: ${rawStatus}`,
                            dueDate: new Date(),
                            category: 'commercial',
                            unitId: 1,
                            userId: 2,
                            status: 'pending'
                        });
                    } else {
                        // Update existing task title to match new logic just in case
                        await existingTask.update({ title: title });
                    }
                }

                totalProcessed++;
            }
        }

        console.log(`STRICT IMPORT COMPLETE. Processed ${totalProcessed} records.`);

    } catch (e) {
        console.error('CRITICAL ERROR:', e);
    } finally {
        await sequelize.close();
    }
}

runImport();
