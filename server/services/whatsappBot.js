const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const AIConfig = require('../models/AIConfig');

// --- CONFIGURAÇÃO DA IA (GEMINI FLASH) ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const UNIT_NAME = "Vox2You Brasília - Águas Claras";

// Variáveis globais para o modelo e sessões
let model;
const activeChats = {};

const loadAIConfig = async () => {
    try {
        let config = await AIConfig.findOne();
        if (!config) config = await AIConfig.create({});

        const knowledgeData = JSON.parse(config.knowledgeBase || '[]');
        const knowledgeText = knowledgeData.map(k => `--- ${k.title} ---\n${k.content}`).join('\n\n');

        // Instrução Final Combinada
        const finalInstruction = `
      ${config.systemPrompt}
      
      CONTEXTO DA UNIDADE:
      Sua unidade é a ${UNIT_NAME}.
      
      BASE DE CONHECIMENTO ADICIONAL:
      ${knowledgeText}
      
      REGRAS COMPLEMENTARES:
      - Responda em português.
      - Seja breve e use emojis moderadamente.
      - Termine sempre com uma pergunta.
    `;

        model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: finalInstruction
        });

        console.log('[SDR] Configurações da JulIA carregadas do banco de dados.');
    } catch (error) {
        console.error('Erro ao carregar prompt da JulIA:', error);
    }
};

const reloadAIConfig = async () => {
    console.log('[SDR IA] Recarregando Cérebro e Base de Conhecimento...');
    await loadAIConfig();
    return "Cérebro atualizado com sucesso!";
};

const startWhatsAppBot = async () => {
    await loadAIConfig();

    // Mantém o intervalo como segurança, mas agora temos a opção manual
    setInterval(loadAIConfig, 10 * 60 * 1000);

    console.log('[SDR GEMINI] Inicializando cliente WhatsApp...');

    const client = new Client({
        authStrategy: new LocalAuth({ dataPath: './wpp_session' }),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    });

    client.on('qr', (qr) => {
        console.log('[QR CODE] Escaneie para conectar:');
        qrcode.generate(qr, { small: true });
    });

    client.on('ready', () => {
        console.log(`[ONLINE] SDR conectado em: ${UNIT_NAME}`);
        console.log('[IA] Rodando motor: Gemini 1.5 Flash ⚡ (Persona: JulIA)');
    });

    client.on('message', async (msg) => {
        if (msg.from.includes('@g.us') || msg.from.includes('status')) return;
        if (msg.body.length < 2) return;

        const chatId = msg.from;
        console.log(`[LEAD] ${chatId.substring(0, 5)}...: ${msg.body}`);

        if (!model) return;

        const chat = await msg.getChat();
        chat.sendStateTyping();

        try {
            await new Promise(r => setTimeout(r, 3000));

            if (!activeChats[chatId]) {
                activeChats[chatId] = model.startChat({
                    history: [],
                    generationConfig: {
                        maxOutputTokens: 250,
                        temperature: 0.7,
                    },
                });
            }

            const chatSession = activeChats[chatId];
            const result = await chatSession.sendMessage(msg.body);
            const responseText = result.response.text();

            msg.reply(responseText);
            chat.clearState();
            console.log(`[JulIA] Respondeu: ${responseText}`);

        } catch (error) {
            console.error('Erro na IA:', error);
            chat.clearState();
        }
    });

    client.initialize();
};

module.exports = { startWhatsAppBot, reloadAIConfig };
