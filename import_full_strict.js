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
    temperature: { type: DataTypes.STRING, defaultValue: 'cold' }, // ADDED TEMPERATURE
    handledBy: { type: DataTypes.TEXT, defaultValue: 'HUMAN' },
    origin_id_importado: { type: DataTypes.STRING, unique: true },

    // Financials
    sales_value: DataTypes.FLOAT,
    enrollment_value: DataTypes.FLOAT,
    material_value: DataTypes.FLOAT,
    payment_method: DataTypes.STRING,
    installments: DataTypes.INTEGER,
    card_brand: DataTypes.STRING,

    // Profile
    course_interest: DataTypes.STRING,
    neighborhood: DataTypes.STRING,
    profession: DataTypes.STRING,
    city: DataTypes.STRING,

    // Status/Outcome
    loss_reason: DataTypes.STRING,

    // Meta (Dates)
    createdAt: DataTypes.DATE,
    fechada_em: DataTypes.DATE,
    unitId: { type: DataTypes.INTEGER, defaultValue: 2 },
    consultant_id: DataTypes.INTEGER,

    // Tracking
    tracking: DataTypes.TEXT, // JSON
    metadata: DataTypes.TEXT, // JSON
    history: DataTypes.TEXT, // JSON
    attempts: DataTypes.TEXT // JSON
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

const USER_MAP = {
    'Greise Hellen': 7,
    'Marcos Eduardo Martins': 5,
    'Vitor Araújo Veras': 8,
    'Mendes Silva Santos': 2,
    'Master Mendes': 1
};

// DATE PARSER
function parseDate(val) {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'number') {
        return new Date(Math.round((val - 25569) * 86400 * 1000));
    }
    const s = String(val).trim();
    if (!s) return null;

    if (s.match(/^\d{1,2}\.\d{1,2}\.\d{4}/)) {
        const datePart = s.split(' ')[0];
        const parts = datePart.split('.');
        return new Date(parts[2], parts[1] - 1, parts[0], 12, 0, 0);
    }
    if (s.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)) {
        const datePart = s.split(' ')[0];
        const parts = datePart.split('/');
        return new Date(parts[2], parts[1] - 1, parts[0], 12, 0, 0);
    }
    if (s.match(/^\d{4}-\d{2}-\d{2}/)) {
        const datePart = s.split(' ')[0];
        const parts = datePart.split('-');
        return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    }
    return null;
}

async function runImport() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        console.log('--- RESETTING LEADS & COMMERCIAL TASKS ---');
        await Task.destroy({ where: { category: 'commercial' } });
        await Lead.destroy({ where: {}, truncate: true });
        console.log('Database Cleared.');

        const files = [
            'importado_export_leads_2026-01-07 (1).xlsx',
            'importado_export_leads_2026-01-07 (2).xlsx',
            'importado_export_leads_2026-01-07 (3).xlsx'
        ];

        let totalProcessed = 0;

        for (const fileName of files) {
            const filePath = path.join(__dirname, fileName);
            if (!fs.existsSync(filePath)) continue;

            console.log(`Processing ${fileName}...`);
            const workbook = XLSX.readFile(filePath);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(sheet);

            if (data.length > 0) {
                const first = data[0];
                const dKey = Object.keys(first).find(k => k.trim() === 'Data Criada') || 'Data Criada';
                console.log(`[DEBUG] First Row 'Data Criada': ${first[dKey]} -> Parsed: ${parseDate(first[dKey])}`);
            }

            for (const row of data) {
                const idKey = Object.keys(row).find(k => k.toLowerCase().includes('id') && !k.toLowerCase().includes('status'));
                if (!idKey) continue;

                const importadoId = String(row[idKey]).trim();
                const statusKey = Object.keys(row).find(k => k.trim() === 'Etapa do lead');
                const rawStatus = statusKey ? String(row[statusKey]).trim() : '';
                const dateKey = Object.keys(row).find(k => k.trim() === 'Data Criada') || 'Data Criada';
                const closedKey = 'Fechada em';

                const nameKey = Object.keys(row).find(k => (k.toLowerCase().includes('lead') && k.toLowerCase().includes('título')) || k.toLowerCase() === 'nome');
                const phoneKey = Object.keys(row).find(k => k.toLowerCase().includes('contato') || k.toLowerCase().includes('fone'));
                const respKey = 'Lead usuário responsável';

                // Responsible
                const respName = row[respKey] || '';
                let consultantId = 2; // Default
                if (respName) {
                    const mappedId = USER_MAP[Object.keys(USER_MAP).find(k => respName.includes(k))];
                    if (mappedId) consultantId = mappedId;
                }

                // Interaction
                const hasInteraction = [
                    row['Resultado 1º tentativa'],
                    row['Resultado 2º tentativa'],
                    row['Follow Up 1'],
                    row['*Tentativas de contato*']
                ].some(val => val && String(val).trim().length > 0 && String(val).trim() !== '0');

                // Status
                let status = 'new';
                const s = rawStatus.toLowerCase();
                if (s.includes('novo') || s.includes('new') || s.includes('entrada')) status = 'new';
                else if (s.includes('conexão')) status = 'connected';
                else if (s.includes('conectando') || s.includes('ligação') || s.includes('tentativa')) status = 'connecting';
                else if (s.includes('agenda') || s.includes('entrevista')) status = 'scheduled';
                else if (s.includes('negociação')) status = 'negotiation';
                else if (s.includes('bolo') || s.includes('no-show')) status = 'no_show';
                else if (s.includes('won') || s.includes('matriculado')) status = 'won';
                else if (s.includes('closed') || s.includes('perdido') || s.includes('encerrado')) status = 'closed';
                else status = 'new';

                if (status === 'new' && hasInteraction) status = 'connecting';

                // Temperature
                let temperature = 'cold';
                const rawTemp = String(row['Temperatura'] || '').toLowerCase();
                if (rawTemp.includes('quente')) temperature = 'hot';
                else if (rawTemp.includes('morn')) temperature = 'warm'; // morna, morno
                else if (rawTemp.includes('fria') || rawTemp.includes('frio')) temperature = 'cold';

                // Fields
                const leadData = {
                    origin_id_importado: importadoId,
                    name: row[nameKey] || 'Lead Sem Nome',
                    phone: row[phoneKey] ? String(row[phoneKey]).replace(/\D/g, '') : '',
                    status: status,
                    temperature: temperature, // Mapped
                    unitId: 2,
                    consultant_id: consultantId,
                    handledBy: 'HUMAN',

                    payment_method: row['Forma de pagamento'] || '',
                    loss_reason: row['Motivo de insucesso'] || '',
                    course_interest: row['Curso de Interesse'] || '',
                    neighborhood: row['Bairro'] || '',
                    profession: row['Profissão'] || '',
                    city: 'Brasília',

                    sales_value: row['Venda'] ? parseFloat(String(row['Venda']).replace(/\./g, '').replace(',', '.')) : 0,
                    enrollment_value: row['Valor da matrícula'] ? parseFloat(String(row['Valor da matrícula']).replace(/\./g, '').replace(',', '.')) : 0,
                    material_value: row['Valor material didático'] ? parseFloat(String(row['Valor material didático']).replace(/\./g, '').replace(',', '.')) : 0,
                    installments: parseInt(row['Qtd. de parcela (Cartão de crédito)']) || 0,
                    card_brand: row['Bandeira (Cartão de crédito)'],

                    createdAt: parseDate(row[dateKey]) || new Date(),
                    fechada_em: parseDate(row[closedKey]),

                    tracking: JSON.stringify({
                        utm_source: row['utm_source'],
                        utm_medium: row['utm_medium'],
                        utm_campaign: row['utm_campaign'],
                        utm_content: row['utm_content'],
                        origin: row['Origem']
                    }),
                    metadata: JSON.stringify({
                        media: row['Mídia'],
                        interview_1_date: parseDate(row['Data e hora da entrevista - 1']),
                        visit_date: parseDate(row['Data e hora da visita']),
                        connection_date: parseDate(row['Data e hora da conexão'])
                    })
                };

                let lead = await Lead.findOne({ where: { origin_id_importado: importadoId } });
                if (lead) await lead.update(leadData);
                else lead = await Lead.create(leadData);

                // Tasks
                if (!['won', 'closed', 'lost', 'archived'].includes(status)) {
                    let title = 'Dar Seguimento';
                    const safeName = (leadData.name || '').split(' ')[0];
                    if (status === 'scheduled') title = `Reunião: ${safeName}`;
                    else if (status === 'connecting') title = `Retentativa: ${safeName}`;
                    else if (status === 'connected') title = `Conexão: ${safeName}`;
                    else if (status === 'negotiation') title = `Negociação: ${safeName}`;
                    else if (status === 'no_show') title = `No Show: ${safeName}`;
                    else if (status === 'new') title = `Iniciar Conexão: ${safeName}`;

                    const existingTask = await Task.findOne({ where: { leadId: lead.id, category: 'commercial' } });
                    if (!existingTask) {
                        await Task.create({
                            leadId: lead.id,
                            title: title,
                            description: `Lead importado. T: ${temperature}`,
                            dueDate: new Date(),
                            category: 'commercial',
                            unitId: 2,
                            userId: consultantId,
                            status: 'pending'
                        });
                    } else {
                        await existingTask.update({ title: title, userId: consultantId, unitId: 2 });
                    }
                }
                totalProcessed++;
            }
        }
        console.log(`FULL IMPORT COMPLETE to UNIT 2. Processed ${totalProcessed} records.`);
    } catch (e) { console.error('CRITICAL ERROR:', e); }
    finally { await sequelize.close(); }
}
runImport();
