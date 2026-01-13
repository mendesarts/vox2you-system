const XLSX = require('xlsx');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// 1. DATABASE CONFIGURATION
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'server', 'voxflow.sqlite'),
    logging: false
});

// 2. MODEL DEFINITIONS (Simplified for Import)
const Lead = sequelize.define('Lead', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: DataTypes.STRING,
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    status: { type: DataTypes.TEXT, defaultValue: 'new' },
    handledBy: { type: DataTypes.TEXT, defaultValue: 'HUMAN' },
    origin_id_importado: { type: DataTypes.STRING, unique: true },
    utm_source: DataTypes.STRING,
    utm_medium: DataTypes.STRING,
    utm_campaign: DataTypes.STRING,
    utm_term: DataTypes.STRING,
    sales_value: DataTypes.FLOAT,
    enrollment_value: DataTypes.FLOAT,
    payment_method: DataTypes.STRING,
    course_interest: DataTypes.STRING,
    neighborhood: DataTypes.STRING,
    profession: DataTypes.STRING,
    loss_reason: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    unitId: { type: DataTypes.INTEGER, defaultValue: 1 } // Default to Unit 1 (Brasília)
}, { tableName: 'Leads' });

const CadenceLog = sequelize.define('CadenceLog', {
    leadId: DataTypes.INTEGER,
    cadence_type: DataTypes.ENUM('Bolo', 'Negociação'),
    step_name: DataTypes.STRING,
    status: DataTypes.STRING,
    timestamp: DataTypes.DATE
}, { tableName: 'CadenceLogs' });

const ContactAttempt = sequelize.define('ContactAttempt', {
    leadId: DataTypes.INTEGER,
    attempt_number: DataTypes.INTEGER,
    result: DataTypes.STRING,
    type: DataTypes.STRING,
    timestamp: DataTypes.DATE
}, { tableName: 'ContactAttempts' });

// 3. UTILS
const cleanMoney = (val) => {
    if (!val) return 0;
    const clean = String(val).replace(/[^0-9,.-]/g, '').replace('.', '').replace(',', '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
};

const cleanPhone = (val) => {
    if (!val) return '';
    return String(val).replace(/\D/g, '');
};

const parseImportadoDate = (val) => {
    if (!val) return null;
    if (typeof val === 'number') {
        const d = new Date((val - 25569) * 86400 * 1000); // Excel date to JS
        return d;
    }
    // Format: "06.01.2026 18:11:03"
    const parts = String(val).split(' ');
    if (parts.length >= 1) {
        const dparts = parts[0].split('.');
        if (dparts.length === 3) {
            const dateStr = `${dparts[2]}-${dparts[1]}-${dparts[0]}` + (parts[1] ? `T${parts[1]}` : 'T12:00:00');
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) return d;
        }
    }
    return new Date(val);
};

// 4. MAIN IMPORT FUNCTION
async function runImport() {
    try {
        console.log('📊 Iniciando Importação Deep Copy (XLSX)...');

        const filePath = path.join(__dirname, 'importado_export_leads_2026-01-07 (1).xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const headers = rows[0];
        const getIdx = (name) => headers.indexOf(name);

        // Map column indices
        const map = {
            id: getIdx('ID'),
            name: getIdx('Lead título'),
            dateCreated: getIdx('Data Criada'),
            profession: getIdx('Profissão'),
            neighborhood: getIdx('Bairro'),
            courseInterest: getIdx('Curso de Interesse'),
            lossReason: getIdx('Motivo de insucesso'),

            // Financial
            paymentMethod: getIdx('Forma de pagamento'),
            enrollValue: getIdx('Valor da matrícula'),
            salesValue: getIdx('Valor do curso'),

            // Marketing
            utm_source: getIdx('utm_source'),
            utm_medium: getIdx('utm_medium'),
            utm_campaign: getIdx('utm_campaign'),
            utm_term: getIdx('utm_term'),

            // Since Email and Phone names can vary, we search for them
            email: headers.findIndex(h => String(h).toLowerCase().includes('email')),
            phone: headers.findIndex(h => String(h).toLowerCase().includes('telefone') || String(h).toLowerCase().includes('contato principal')),
        };

        console.log(`📑 Processando ${rows.length - 1} registros...`);

        let successCount = 0;

        for (let i = 1; i < rows.length; i++) {
            const r = rows[i];
            const originId = r[map.id] ? String(r[map.id]) : null;

            if (!originId || originId === 'undefined') continue;

            // MAP Column Indices
            const statusIdx = headers.indexOf('Etapa do lead');

            // DETERMINE STATUS DIRECTLY FROM EXCEL
            let derivedStatus = 'new';
            if (statusIdx !== -1) {
                const rawStatus = r[statusIdx];
                if (rawStatus === 'Novo lead') derivedStatus = 'new';
                else if (rawStatus === 'Conexão') derivedStatus = 'connecting';
                else if (rawStatus === 'Entrevista agendada') derivedStatus = 'scheduled';
                else if (rawStatus === 'Em negociação') derivedStatus = 'negotiation';
                else if (rawStatus === 'Bolo') derivedStatus = 'no_show';
                else derivedStatus = 'new'; // Fallback
            }

            const [lead, created] = await Lead.findOrCreate({
                where: { origin_id_importado: originId },
                defaults: {
                    name: r[map.name] || 'Sem Nome',
                    phone: cleanPhone(r[map.phone]),
                    email: r[map.email] || null,
                    status: derivedStatus,
                    handledBy: 'HUMAN',
                    profession: r[map.profession],
                    neighborhood: r[map.neighborhood],
                    course_interest: r[map.courseInterest],
                    loss_reason: r[map.lossReason],
                    utm_source: r[map.utm_source],
                    utm_medium: r[map.utm_medium],
                    utm_campaign: r[map.utm_campaign],
                    utm_term: r[map.utm_term],
                    sales_value: cleanMoney(r[map.salesValue]),
                    enrollment_value: cleanMoney(r[map.enrollValue]),
                    payment_method: r[map.paymentMethod],
                    createdAt: parseImportadoDate(r[map.dateCreated]) || new Date()
                }
            });

            if (!created) {
                // Update even if exists to ensure deep copy
                await lead.update({
                    profession: r[map.profession] || lead.profession,
                    neighborhood: r[map.neighborhood] || lead.neighborhood,
                    course_interest: r[map.courseInterest] || lead.course_interest,
                    loss_reason: r[map.lossReason] || lead.loss_reason,
                    sales_value: r[map.salesValue] ? cleanMoney(r[map.salesValue]) : lead.sales_value,
                    enrollment_value: r[map.enrollValue] ? cleanMoney(r[map.enrollValue]) : lead.enrollment_value
                });
            }

            // --- CADENCES ---
            await CadenceLog.destroy({ where: { leadId: lead.id } });

            // Cadência Bolo (FU 1 a 5) - Index Range: 61-65
            for (let f = 1; f <= 5; f++) {
                const colName = `Follow Up ${f}`;
                const idxs = headers.reduce((a, e, idx) => (e === colName ? a.concat(idx) : a), []);
                const boloIdx = idxs.find(idx => idx >= 61 && idx <= 65);
                if (boloIdx && r[boloIdx]) {
                    await CadenceLog.create({
                        leadId: lead.id,
                        cadence_type: 'Bolo',
                        step_name: `Follow Up ${f}`,
                        status: r[boloIdx],
                        timestamp: new Date()
                    });
                }
            }

            // Cadência Negociação (FU 1 a 7) - Index Range: 67-73
            for (let f = 1; f <= 7; f++) {
                const colName = `Follow Up ${f}`;
                const idxs = headers.reduce((a, e, idx) => (e === colName ? a.concat(idx) : a), []);
                const negIdx = idxs.find(idx => idx >= 67 && idx <= 73);
                if (negIdx && r[negIdx]) {
                    await CadenceLog.create({
                        leadId: lead.id,
                        cadence_type: 'Negociação',
                        step_name: `Follow Up ${f}`,
                        status: r[negIdx],
                        timestamp: new Date()
                    });
                }
            }

            // --- TENTATIVAS (Resultado 1º tentativa...) ---
            await ContactAttempt.destroy({ where: { leadId: lead.id } });
            for (let t = 1; t <= 5; t++) {
                const colName = `Resultado ${t}º tentativa`;
                const tIdx = getIdx(colName);
                if (tIdx !== -1 && r[tIdx]) {
                    await ContactAttempt.create({
                        leadId: lead.id,
                        attempt_number: t,
                        result: r[tIdx],
                        type: 'Tentativa',
                        timestamp: new Date()
                    });
                }
            }

            successCount++;
            if (successCount % 50 === 0) console.log(`✅ ${successCount} leads processados...`);
        }

        console.log(`\n✨ IMPORTAÇÃO CONCLUÍDA! Total: ${successCount} registros.`);
        process.exit(0);

    } catch (error) {
        console.error('\n❌ ERRO NA IMPORTAÇÃO:');
        console.error(error);
        process.exit(1);
    }
}

runImport();
