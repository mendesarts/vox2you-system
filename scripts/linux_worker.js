const axios = require('axios'); // Certifique-se de ter instalado: npm install axios

// CONFIGURAÇÃO
// IMPORTANTE: Ajuste para o IP do seu servidor ou URL da Vercel
const API_URL = process.env.API_URL || 'https://meuvoxflow.vercel.app/api';

// ============================================================
// 1. ESCUTAR MENSAGENS RECEBIDAS (INBOX)
// ============================================================
// (Assumindo que 'client' é sua instância do whatsapp-web.js ou baileys)

client.on('message', async msg => {
    // Ignora grupos e status
    if (msg.from.includes('@g.us') || msg.isStatus) return;

    const phone = msg.from.replace('@c.us', '');
    const content = msg.body;

    console.log(`[INBOX] Recebido de ${phone}: ${content}`);

    try {
        // Envia para o banco de dados da Vercel
        await axios.post(`${API_URL}/sync/incoming`, {
            phone: phone,
            content: content,
            type: msg.type
        });
        console.log(' -> Sincronizado com o CRM!');
    } catch (error) {
        console.error(' [ERRO] Falha ao salvar no CRM:', error.message);
    }

    // ... AQUI CONTINUA SUA LÓGICA DE IA JÁ EXISTENTE ...
});

// ============================================================
// 2. PROCESSAR FILA DE ENVIO (OUTBOX)
// ============================================================
// Verifica a cada 5 segundos se tem mensagem nova para enviar
setInterval(async () => {
    try {
        // 1. Busca mensagens pendentes
        const res = await axios.get(`${API_URL}/sync/outbox`);
        const messages = res.data;

        if (messages.length > 0) {
            console.log(`[OUTBOX] Encontradas ${messages.length} mensagens para enviar.`);

            const sentIds = [];

            for (const msg of messages) {
                if (!msg.Lead || !msg.Lead.phone) continue;

                const chatId = `${msg.Lead.phone}@c.us`;

                // Envia pelo WhatsApp
                await client.sendMessage(chatId, msg.content);
                console.log(` -> Enviado para ${msg.Lead.phone}: "${msg.content}"`);

                sentIds.push(msg.id);

                // Pausa aleatória entre envios para segurança (1 a 3 seg)
                await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
            }

            // 2. Confirma o envio para a API (para mudar status para SENT)
            if (sentIds.length > 0) {
                await axios.post(`${API_URL}/sync/confirm-send`, { ids: sentIds });
            }
        }
    } catch (error) {
        console.error('[SYNC ERROR] Falha ao buscar fila:', error.message);
    }
}, 5000);
