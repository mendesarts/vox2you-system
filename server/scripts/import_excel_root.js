const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { Lead, User, CadenceLog, ContactAttempt, Task, Unit } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

const ROOT_DIR = path.resolve(__dirname, '../../'); // Go up from server/scripts to Root
const FILE_PATTERN = /importado_export_leads_.*\.xlsx$/;

// CANONICAL MAP (Strict Mapping based on User Request)
const KEYWORD_ALIASES = {
    origin_id_importado: ['id', 'lead id'],
    name: ['lead título', 'título do negócio', 'contato principal', 'name', 'nome do contato'],
    phone: ['telefone comercial', 'telefone', 'celular', 'whatsapp', 'mobile', 'celular (contato)'],
    email: ['email', 'mail', 'e-mail', 'email comercial (contato)', 'email pessoal (contato)'],
    status: ['etapa do lead', 'status'],
    responsible: ['lead usuário responsável', 'responsável'],
    tags: ['lead tags', 'tags'],
    temperature: ['temperatura'],
    lossReason: ['motivo de insucesso'],
    sales_value: ['venda', 'price', 'valor'],
    enrollment_value: ['valor da matrícula', 'matricula'],
    payment_method: ['forma de pagamento'],
    installments: ['qtd. de parcela (cartão de crédito)', 'parcelas'],
    card_brand: ['bandeira (cartão de crédito)', 'bandeira'],
    source: ['origem'],
    media: ['mídia'],
    courseInterest: ['curso de interesse', 'produto'],
    createdAt: ['data criada', 'criado em']
};

const mapHeaderToSystem = (header) => {
    const h = String(header).toLowerCase().trim();
    for (const [key, aliases] of Object.entries(KEYWORD_ALIASES)) {
        if (aliases.some(a => h === a || h.startsWith(a))) return key;
    }
    return null;
};

async function importLeads() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB.');
        const dbPath = sequelize.options.storage || sequelize.config?.storage || 'Unknown/Postgres';
        console.log('🔍 DB Storage Path:', dbPath);


        // Load Users for Reconciliation
        const users = await User.findAll();
        const userMap = {};
        users.forEach(u => userMap[u.name.toLowerCase().trim()] = u);
        const adminUser = users.find(u => [1, 10].includes(u.roleId)) || users[0];

        // Find Files
        const files = fs.readdirSync(ROOT_DIR).filter(f => FILE_PATTERN.test(f));
        console.log(`📂 Found ${files.length} spreadsheet(s):`, files);

        if (files.length === 0) {
            console.log('No files found matching pattern importado_export_leads_*.xlsx');
            return;
        }

        for (const file of files) {
            console.log(`\n🚀 Processing: ${file}`);
            const wb = XLSX.readFile(path.join(ROOT_DIR, file));
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

            console.log(`   rows: ${rawData.length}`);

            let createdCount = 0;
            let updatedCount = 0;

            for (const row of rawData) {
                // Map Data
                const lead = {
                    metadata: { importHistory: [], sourceFile: file },
                    tags: ['Importado via Root Script']
                };
                const headers = Object.keys(row);

                // Identify Columns & Values
                for (const header of headers) {
                    const sysKey = mapHeaderToSystem(header);
                    const val = String(row[header]).trim();
                    if (!val) continue;

                    if (sysKey) {
                        // Apply specific parsing
                        if (sysKey === 'phone') lead.phone = val.replace(/\D/g, '');
                        else if (sysKey === 'sales_value') lead.sales_value = parseFloat(val.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
                        else if (sysKey === 'enrollment_value') lead.enrollment_value = parseFloat(val.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
                        else if (sysKey === 'tags') {
                            const t = val.split(',').map(tag => tag.trim()).filter(Boolean);
                            lead.tags.push(...t);
                        }
                        else if (sysKey === 'installments') lead.installments = (val.match(/\d+/) || [val])[0];
                        else if (sysKey === 'createdAt') {
                            if (val.includes('/')) {
                                const [d, m, y] = val.split('/');
                                lead.createdAt = new Date(`${y}-${m}-${d}`);
                            } else {
                                lead.createdAt = new Date(val);
                            }
                        }
                        else if (sysKey === 'status') {
                            const s = val.toLowerCase();
                            if (s.includes('won') || s.includes('ganho')) lead.status = 'won';
                            else if (s.includes('lost') || s.includes('perdido')) lead.status = 'closed_lost';
                            else if (s === 'bolo' || s.includes('nurturing')) lead.status = 'nurturing';
                            else lead.status = 'new';
                        }
                        else lead[sysKey] = val;
                    }

                    // Relationships Scanners (History)
                    const isFollowUp = header.match(/Follow Up \d+/i);
                    const isResult = header.match(/Resultado .* tentativa/i);
                    if (isFollowUp || isResult) {
                        let attemptNum = 1;
                        if (isResult) {
                            const m = header.match(/(\d+)/);
                            if (m) attemptNum = parseInt(m[1]);
                        }

                        if (!lead.cadenceLogs) lead.cadenceLogs = [];
                        lead.cadenceLogs.push({
                            notes: `${header}: ${val}`,
                            date: lead.createdAt || new Date(),
                            type: isFollowUp ? 'cadence' : 'attempt',
                            attemptNumber: attemptNum
                        });
                    }
                }

                if (!lead.name && !lead.phone) continue; // Skip empty rows

                // Resolve Owner
                let ownerStr = String(row['Lead usuário responsável'] || row['Responsável'] || lead.responsible || '').trim();
                let owner = userMap[ownerStr.toLowerCase()];
                if (!owner && ownerStr) {
                    // Fuzzy? 
                    const match = users.find(u => u.name.toLowerCase().includes(ownerStr.toLowerCase()));
                    if (match) owner = match;
                }
                const responsibleId = owner ? owner.id : adminUser.id;
                const unitId = owner ? owner.unitId : adminUser.unitId;

                // Dedup
                let existing = null;
                if (lead.origin_id_importado) {
                    existing = await Lead.findOne({ where: { origin_id_importado: lead.origin_id_importado } });
                }
                if (!existing && lead.phone) {
                    existing = await Lead.findOne({ where: { phone: lead.phone, unitId: unitId } });
                }

                // PREPARE SAVE
                const modelData = {
                    ...lead,
                    responsibleId,
                    consultant_id: responsibleId, // Ensure consistency
                    unitId,
                    phone: lead.phone || '0000000000',
                    value: lead.sales_value, // Sync
                    tags: JSON.stringify(lead.tags),
                    metadata: JSON.stringify(lead.metadata)
                };

                let savedLead;
                if (existing) {
                    // console.log(`   Updating ID ${existing.id} (${existing.name})`);
                    await existing.update(modelData);
                    savedLead = existing;
                    updatedCount++;
                } else {
                    // console.log(`   Creating ${lead.name}`);
                    savedLead = await Lead.create(modelData);
                    createdCount++;
                }

                // Process Logs
                if (lead.cadenceLogs) {
                    for (const log of lead.cadenceLogs) {
                        if (log.type === 'cadence') {
                            await CadenceLog.create({
                                leadId: savedLead.id,
                                cadence_type: 'Negociação', // Default
                                step_name: log.notes, // Store content in step_name
                                status: 'completed',
                                timestamp: log.date
                            });
                        } else {
                            await ContactAttempt.create({
                                leadId: savedLead.id,
                                attempt_number: log.attemptNumber,
                                result: log.notes,
                                type: 'Tentativa',
                                timestamp: log.date
                            });
                        }
                    }
                }
            }
            console.log(`   Stats: ${createdCount} Created, ${updatedCount} Updated.`);
        }
        console.log('✅ Import Completed.');
    } catch (e) {
        console.error('CRITICAL ERROR:', e);
    }
}

importLeads();
