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
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// Rotas da API
const aiController = require('./controllers/aiController');
app.post('/api/webhook/whatsapp', aiController.handleIncomingMessage);

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
    app.use('/api/units', require('./routes/units'));
} catch (e) { console.log('Erro ao carregar rotas:', e); }

app.get('/', (req, res) => res.send('Vox2you System Active'));

const sequelize = process.env.DATABASE_URL
    ? new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }, // SSL necessário para o Cloud SQL/Neon/Etc
        logging: false
    })
    : new Sequelize({
        dialect: 'sqlite',
        storage: 'voxflow.sqlite',
        logging: false
    });

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
