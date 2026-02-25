const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

console.log('🔄 Iniciando teste de conexão do WhatsApp...');

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './wpp_session_test' }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process', // <- this one doesn't works in Windows
            '--disable-gpu'
        ]
    }
});

client.on('qr', (qr) => {
    console.log('✅ QR Code recebido!');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Cliente do WhatsApp conectado com sucesso!');
    process.exit(0);
});

client.on('authenticated', () => {
    console.log('✅ Cliente autenticado!');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Falha na autenticação:', msg);
});

client.on('disconnected', (reason) => {
    console.log('❌ Cliente desconectado:', reason);
});

console.log('🚀 Inicializando cliente...');
client.initialize().catch(err => {
    console.error('❌ Erro fatal ao inicializar o cliente:', err);
});
