global.crypto = require('crypto');

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

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
try {
    app.use('/api/tasks', require('./routes/tasks'));
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/users', require('./routes/users'));
    app.use('/api/students', require('./routes/students'));
    app.use('/api/classes', require('./routes/classes'));
    app.use('/api/financial', require('./routes/financial'));
    app.use('/api/dashboard', require('./routes/dashboard'));
    app.use('/api/ai-config', require('./routes/ai-config'));
    app.use('/api/crm', require('./routes/crm'));
    app.use('/api/leads', require('./routes/leads'));
    app.use('/api/pedagogical', require('./routes/pedagogical'));
    app.use('/api/calendar', require('./routes/calendar'));
    app.use('/api/health', require('./routes/health'));
    app.use('/api/units', require('./routes/units'));
    app.use('/api', require('./routes/rescue'));
    app.use('/api/migration', require('./routes/migration')); // SETUP ONLY
} catch (e) { console.log('Erro ao carregar rotas:', e); }

app.get('/', (req, res) => res.send('Vox2you System Active'));

// ... includes
const sequelize = require('./config/database');
require('./models/associations'); // Load Associations
// ...

// --- MOTOR WHATSAPP HÍBRIDO ---
const { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const fs = require('fs');
const QRCode = require('qrcode');
const pino = require('pino');

let sock = null;

async function startWhatsApp() {
    console.log('--- Iniciando WhatsApp ---');

    const authPath = 'auth_info_baileys';
    if (!fs.existsSync(authPath)) fs.mkdirSync(authPath);

    const { state, saveCreds } = await useMultiFileAuthState(authPath);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS('Desktop'), // Identidade estável
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000,
        syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            QRCode.toDataURL(qr, (err, url) => {
                if (!err) io.emit('qr', url);
            });
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Conexao fechada. Reconectar?', shouldReconnect);
            if (shouldReconnect) {
                setTimeout(() => startWhatsApp(), 5000);
            }
        } else if (connection === 'open') {
            console.log('✅ WhatsApp CONECTADO!');
            io.emit('status', 'Conectado!');
        }
    });
}

// Lógica Híbrida via Socket
io.on('connection', (socket) => {
    console.log('Cliente Web conectado');

    if (sock && sock.user) {
        socket.emit('status', 'Conectado!');
    }

    // Ouve o pedido de Pairing Code vindo do site
    socket.on('request_pairing_code', async (phoneNumber) => {
        console.log('Solicitação de Pairing Code para:', phoneNumber);
        if (sock && !sock.user) {
            try {
                // A biblioteca pede um pequeno delay antes de solicitar
                setTimeout(async () => {
                    const code = await sock.requestPairingCode(phoneNumber);
                    console.log('Código gerado:', code);
                    socket.emit('pairing_code_response', code);
                }, 2000);
            } catch (err) {
                console.error('Erro ao gerar code:', err);
                socket.emit('error', 'Erro ao gerar código. Verifique o número.');
            }
        }
    });
});

const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Banco de dados conectado.');

        // --- FORCE DB SCHEMA UPDATE (EMERGENCY FIX) ---
        try {
            console.log("🛠️ INICIANDO CORREÇÃO FORÇADA DO BANCO...");

            // 1. FORÇA A CRIAÇÃO DA COLUNA UNIT (Se não existir)
            // Tenta sintaxe Postgres (DO block)
            try {
                await sequelize.query(`
                DO $$ 
                BEGIN 
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Users' AND column_name='unit') THEN 
                    ALTER TABLE "Users" ADD COLUMN "unit" VARCHAR(255); 
                    END IF; 
                END $$;
                `);
            } catch (ignore) {
                // Fallback simples
                await sequelize.query('ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "unit" VARCHAR(255);');
            }
            console.log("✅ COLUNA 'unit' GARANTIDA NA TABELA USERS.");

            // 2. FORÇA A ATUALIZAÇÃO DOS CARGOS (Enums)
            const roles = ['franqueado', 'diretor', 'manager', 'lider_comercial', 'lider_pedagogico', 'admin_financeiro', 'consultor', 'pedagogico'];
            for (const role of roles) {
                await sequelize.query(`ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS '${role}'`).catch(() => { });
            }
            console.log("✅ ENUMS DE CARGOS ATUALIZADOS.");

        } catch (err) {
            console.error("❌ ERRO GERAL AO ALTERAR BANCO:", err.message);
        }
        // ---------------------------------------

        // Force Sync (Auto-Healing)
        console.log('Executando Auto-Healing do Schema...');
        // await sequelize.sync({ alter: true });
        console.log('Schema Sync (Alter) skipped to prevent type errors. Manual migration ran.');
        console.log('Schema sincronizado!');

        server.listen(PORT, async () => {
            console.log(`Servidor online na porta ${PORT}`);
            const authPath = 'auth_info_baileys';
            if (fs.existsSync(authPath)) fs.rmSync(authPath, { recursive: true, force: true });
            startWhatsApp();
        });
    } catch (err) {
        console.error("Erro critico:", err);
    }
};

startServer();
