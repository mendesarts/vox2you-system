console.log('\n\n🚀🚀🚀 VX-SYSTEM STARTING ON PORT ' + (process.env.PORT || 3000) + ' 🚀🚀🚀\n\n');
global.crypto = require('crypto');

require('dotenv').config();
const express = require('express'); // Trigger Restart 125
const cors = require('cors');
const { Sequelize } = require('sequelize');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Initialize Database Models & Associations
require('./models');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Rotas da API
const aiController = require('./controllers/aiController');
app.post('/api/webhook/whatsapp', aiController.handleIncomingMessage);

// MIGRATION ROUTE (DIRECT INJECTION)
app.get('/api/setup/run-migration', async (req, res) => {
    const logs = [];
    const log = (msg) => logs.push(msg);
    try {
        const { DataTypes } = require('sequelize');
        const User = require('./models/User');
        const Unit = require('./models/Unit');
        const { ROLE_IDS, getRoleId } = require('./config/roles');

        log('🔄 Iniciando Migração (Via Route Injected)...');
        const qi = sequelize.getQueryInterface();

        const colsToAdd = [
            { name: 'roleId', type: DataTypes.INTEGER },
            { name: 'unitId', type: DataTypes.UUID },
            { name: 'unit', type: DataTypes.STRING },
            { name: 'password', type: DataTypes.STRING },
            { name: 'phone', type: DataTypes.STRING },
            { name: 'whatsapp', type: DataTypes.STRING },
            { name: 'avatar', type: DataTypes.STRING },
            { name: 'profilePicture', type: DataTypes.TEXT },
            { name: 'lastLogin', type: DataTypes.DATE }
        ];

        for (const col of colsToAdd) {
            try {
                await qi.addColumn('Users', col.name, { type: col.type, allowNull: true });
                log(`✅ Coluna ${col.name} verificada.`);
            } catch (e) { }
        }

        const users = await User.findAll();
        log(`📊 Users found: ${users.length}`);

        let targetUnit = await Unit.findOne({ where: { name: 'Brasília.ÁguasClaras' } });
        if (!targetUnit) {
            // Try partial
            const pUnit = await Unit.findOne({ where: { name: 'Brasília' } });
            if (pUnit) {
                pUnit.name = 'Brasília.ÁguasClaras';
                await pUnit.save();
                targetUnit = pUnit;
            } else {
                targetUnit = await Unit.create({
                    name: 'Brasília.ÁguasClaras',
                    city: 'Brasília',
                    active: true
                });
            }
        }
        log(`🏢 Target Unit: ${targetUnit.id}`);

        for (const u of users) {
            let changed = false;
            const freshRoleId = getRoleId(u.role);
            if (freshRoleId !== 0 && freshRoleId !== u.roleId) {
                u.roleId = freshRoleId;
                changed = true;
            }
            if (!u.roleId) {
                u.roleId = ROLE_IDS.CONSULTANT;
                changed = true;
            }
            if (!u.unitId) {
                u.unitId = targetUnit.id;
                u.unit = targetUnit.name;
                changed = true;
            }
            if (changed) await u.save();
        }
        res.json({ success: true, logs });
    } catch (e) {
        res.status(500).json({ error: e.message, logs });
    }
});

// Rotas do Sistema (Para quando formos mexer no resto)
// Rotas do Sistema (Carregamento Independente)
const safeLoadRoute = (path, name) => {
    try {
        app.use(path, require(`./routes/${name}`));
        console.log(`✅ Rota carregada: ${path}`);
    } catch (e) {
        console.error(`❌ Erro ao carregar rota ${path}:`, e.message);
    }
};

safeLoadRoute('/api/tasks', 'tasks');
safeLoadRoute('/api/auth', 'auth');
safeLoadRoute('/api/users', 'users');
safeLoadRoute('/api/students', 'students');
safeLoadRoute('/api/courses', 'courses');
safeLoadRoute('/api/classes', 'classes');
safeLoadRoute('/api/financial', 'financial');
safeLoadRoute('/api/dashboard', 'dashboard');
safeLoadRoute('/api/ai-config', 'ai-config');
safeLoadRoute('/api/crm', 'crm');
safeLoadRoute('/api/leads', 'leads');
safeLoadRoute('/api/pedagogical', 'pedagogical');
safeLoadRoute('/api/calendar', 'calendar');
safeLoadRoute('/api/health', 'health');
safeLoadRoute('/api/units', 'units');
safeLoadRoute('/api/sdr', 'sdr');
safeLoadRoute('/api/enrollments', 'enrollments');
safeLoadRoute('/api/rescue', 'rescue');
safeLoadRoute('/api/migration', 'migration');
safeLoadRoute('/api/integrations', 'integrations');
safeLoadRoute('/api/contracts', 'contracts');
safeLoadRoute('/api/reports', 'reports');
safeLoadRoute('/api/sync', 'sync');
safeLoadRoute('/api/installers', 'installers');

// GLOBAL 404 - Return JSON for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: `Rota API não encontrada: ${req.originalUrl}` });
});

app.get('/', (req, res) => res.send('Vox2you System Active'));

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ error: 'Erro interno no servidor', details: err.message });
});

// ... includes
const sequelize = require('./config/database');
require('./models/associations'); // Load Associations
// ...

// --- MOTOR WHATSAPP SDR IA (Brasília) ---
// --- MOTOR WHATSAPP SDR IA (Brasília) ---
// const { startWhatsAppBot } = require('./services/whatsappBot'); // DISABLED FOR STABILITY

// Lógica de Socket básica
io.on('connection', (socket) => {
    console.log('Cliente Web conectado');
});

const startServer = async () => {
    try {
        server.listen(PORT, () => console.log(`🚀 Server UP on ${PORT} (Optimistic Start)`));

        console.log('Connecting to DB...');
        await sequelize.authenticate();
        console.log('DB Connected.');

        // --- UNIVERSAL SCHEMA FIXES (Dialect Aware) ---
        const qi = sequelize.getQueryInterface();
        const dialect = sequelize.getDialect();
        console.log(`🛠️ INICIANDO CORREÇÃO DO BANCO (Dialect: ${dialect})...`);

        const safeAddColumn = async (tableName, columnName, definition) => {
            try {
                const tableInfo = await qi.describeTable(tableName);
                if (!tableInfo[columnName]) {
                    await qi.addColumn(tableName, columnName, definition);
                    console.log(`✅ Coluna '${columnName}' adicionada a '${tableName}'.`);
                }
            } catch (err) {
                // If table doesn't exist yet, sync will handle it
                if (!err.message.includes('does not exist')) {
                    console.log(`⚠️ Erro ao verificar/adicionar ${columnName} em ${tableName}:`, err.message);
                }
            }
        };

        // 1. Ensure Columns in Users
        const { DataTypes } = require('sequelize');
        await safeAddColumn('Users', 'unit', { type: DataTypes.STRING, allowNull: true, defaultValue: 'Sem Unidade' });
        await safeAddColumn('Users', 'secondaryRoles', { type: DataTypes.JSON, defaultValue: [], allowNull: true });

        // 2. Ensure Columns in Leads
        await safeAddColumn('Leads', 'consultant_id', { type: DataTypes.INTEGER, allowNull: true });

        // 2.1 Ensure Financial Columns
        await safeAddColumn('FinancialRecords', 'launchType', { type: DataTypes.ENUM('unico', 'parcelado', 'recorrente'), defaultValue: 'unico' });
        await safeAddColumn('FinancialRecords', 'periodicity', { type: DataTypes.STRING, defaultValue: 'mensal' });
        await safeAddColumn('FinancialRecords', 'discount', { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 });
        await safeAddColumn('FinancialRecords', 'interest', { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 });
        await safeAddColumn('FinancialRecords', 'fine', { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 });
        await safeAddColumn('FinancialRecords', 'enrollmentId', { type: DataTypes.INTEGER, allowNull: true });

        // 3. Dialect Specific Fixes
        if (dialect === 'postgres') {
            console.log("🐘 Executando correções específicas para PostgreSQL...");
            try {
                // Update Role Enums
                const roles = ['franqueado', 'diretor', 'manager', 'lider_comercial', 'lider_pedagogico', 'admin_financeiro', 'consultor', 'pedagogico'];
                for (const role of roles) {
                    await sequelize.query(`ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS '${role}'`).catch(() => { });
                }
                // Update Lead Status Enums
                const leadStatuses = ['social_comment', 'social_direct', 'social_prospect', 'internal_other', 'internal_team'];
                for (const s of leadStatuses) {
                    await sequelize.query(`ALTER TYPE "enum_Leads_status" ADD VALUE IF NOT EXISTS '${s}'`).catch(() => { });
                }
                // Update Transfer Type Enums
                await sequelize.query(`ALTER TYPE "enum_Transfers_type" ADD VALUE IF NOT EXISTS 'class_transfer'`).catch(() => { });

                // Drop problematic legacy constraints
                await sequelize.query('ALTER TABLE "Classes" DROP CONSTRAINT IF EXISTS "Classes_professorId_fkey"').catch(() => { });
                console.log("✅ Correções Postgres concluídas.");
            } catch (err) {
                console.log("⚠️ Erro em correções Postgres:", err.message);
            }
        } else if (dialect === 'sqlite') {
            console.log("💾 Ambiente SQLite detectado. Pulando ajustes de ENUM/Type do Postgres.");
            // SQLite specific tweaks if needed (currently safe mode sync handles most)
        }

        // 4. Force StudentLogs Table (If sync fails)
        try {
            await sequelize.query(`
                CREATE TABLE IF NOT EXISTS "StudentLogs" (
                    "id" ${dialect === 'sqlite' ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'SERIAL PRIMARY KEY'},
                    "studentId" INTEGER NOT NULL,
                    "action" VARCHAR(255) NOT NULL,
                    "description" TEXT NOT NULL,
                    "details" ${dialect === 'sqlite' ? 'TEXT' : 'JSON'},
                    "date" ${dialect === 'sqlite' ? 'DATETIME DEFAULT CURRENT_TIMESTAMP' : 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'},
                    "createdAt" ${dialect === 'sqlite' ? 'DATETIME DEFAULT CURRENT_TIMESTAMP' : 'TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()'},
                    "updatedAt" ${dialect === 'sqlite' ? 'DATETIME DEFAULT CURRENT_TIMESTAMP' : 'TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()'}
                );
            `);
            console.log("✅ Tabela 'StudentLogs' verificada.");
        } catch (err) {
            console.log("⚠️ Erro ao garantir StudentLogs:", err.message);
        }

        // ---------------------------------------

        // Force Sync (Auto-Healing)
        console.log('Executando Sync (Safe Mode)...');
        try {
            await sequelize.sync({ alter: true });
            console.log('Schema sincronizado!');
        } catch (syncErr) {
            console.error('⚠️ Aviso: Erro no sync (Auto-Healing), mas tentando continuar:', syncErr.message);
        }

        // Server already listening (Optimistic)
        console.log(`DB & Sync Complete.`);
        const authPath = 'auth_info_baileys';
        // if (fs.existsSync(authPath)) fs.rmSync(authPath, { recursive: true, force: true }); // Disabled cleaning to prevent loop
        // startWhatsAppBot(); // TEMPORARIAMENTE DESABILITADO - Causando crash no ambiente local
    } catch (err) {
        console.error("Erro critico:", err);
    }
};

startServer();

module.exports = app;
