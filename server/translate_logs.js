const { DataTypes } = require('sequelize');
const sequelize = require('./config/database');

const Lead = sequelize.define('Lead', {
    id: { type: DataTypes.STRING, primaryKey: true }, // UUID or String logic
    history: { type: DataTypes.TEXT }
}, {
    tableName: 'Leads',
    timestamps: false // We only update specific fields
});

const STATUS_TRANSLATIONS = {
    'new': 'Novo Lead',
    'connecting': 'Tentativa de Contato',
    'connected': 'Conectado',
    'scheduled': 'Agendado',
    'negotiation': 'Negociação',
    'won': 'Venda Realizada',
    'loose': 'Perdido',
    'no_show': 'Não Compareceu',
    'closed': 'Arquivado'
};

const translateContent = (content) => {
    if (!content) return content;

    // 1. Created
    if (content.includes('Lead criado') || content.includes('Lead created')) {
        return 'Lead criado manualmente via Kanban';
    }

    // 2. Manual Update
    if (content.includes('Atualização Manual') || content.includes('Manual update') || content.includes('Atualização manual')) {
        return 'Atualização manual de dados';
    }

    // 3. Move Stage
    // Pattern: "Moveu de X para Y" or "Moved from X to Y"
    // We try to capture X and Y
    const moveRegex = /(?:Moveu de|Moved from)\s+(.+?)\s+(?:para|to)\s+(.+?)(?:\.|$)/i;
    const match = content.match(moveRegex);

    if (match) {
        let oldS = match[1].trim().replace(/['"]/g, '');
        let newS = match[2].trim().replace(/['"]/g, '');

        // Translate Statuses if they are keys
        if (STATUS_TRANSLATIONS[oldS]) oldS = STATUS_TRANSLATIONS[oldS];
        if (STATUS_TRANSLATIONS[newS]) newS = STATUS_TRANSLATIONS[newS];

        return `Alterou status de "${oldS}" para "${newS}".`;
    }

    // 4. Attempts
    if (content.includes('Tentativa de contato')) {
        return content; // Already PT
    }

    // 5. Explicit English Status in other contexts? (Rare)

    // 6. Generic Note handling (Preserve Obs?)
    // If it has "Obs:", preserve it.
    let extra = '';
    if (content.includes('Obs:')) {
        extra = ' Obs:' + content.split('Obs:')[1];
    }

    // If we didn't match specific patterns but found English words:
    if (content.includes('Moved')) return content.replace('Moved', 'Moveu');

    return content;
};

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB.');

        const leads = await Lead.findAll();
        console.log(`Found ${leads.length} leads. Processing translations...`);

        let updatedCount = 0;

        for (const lead of leads) {
            let history = [];
            let changed = false;

            try {
                history = JSON.parse(lead.history || '[]');
            } catch (e) {
                continue;
            }

            const newHistory = history.map(h => {
                // Debug log for first lead
                if (leads.indexOf(lead) === 0) console.log('Checking log:', h.content);

                const newContent = translateContent(h.content);
                if (newContent !== h.content) {
                    console.log(` Translating: "${h.content}" -> "${newContent}"`);
                    changed = true;
                    return { ...h, content: newContent };
                }
                return h;
            });

            if (changed) {
                await lead.update({ history: JSON.stringify(newHistory) });
                updatedCount++;
                process.stdout.write('.');
            }
        }

        console.log(`\nDone! Translated history for ${updatedCount} leads.`);
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sequelize.close();
    }
};

run();
