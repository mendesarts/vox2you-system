const axios = require('axios');

const SYSTEM_TOKEN = 'vox-secret-2026';
const BASE_URL = 'http://localhost:5000/api';

async function simulateConversionFlow() {
    console.log('🚀 Iniciando Simulação de Fluxo de Conversão Marketing...');

    try {
        // 1. Simular recebimento de Lead via Webhook do Google Ads
        console.log('\nStep 1: Simulando Webhook do Google Ads (Native)...');
        const webhookPayload = {
            google_key: SYSTEM_TOKEN,
            campaign_id: 'campaign_12345',
            adgroup_id: 'group_67890',
            creative_id: 'ad_999',
            user_column_data: [
                { column_id: 'FULL_NAME', string_value: 'Simulação Teste Marketing' },
                { column_id: 'USER_PHONE', string_value: '11999998888' },
                { column_id: 'USER_EMAIL', string_value: 'teste@marketing.com' },
                { column_id: 'GCLID', string_value: 'gclid_teste_123456789' }
            ]
        };

        const webhookRes = await axios.post(`${BASE_URL}/integrations/leads/webhook`, webhookPayload);
        const leadId = webhookRes.data.leadId;
        console.log(`✅ Lead criado via Webhook! ID: ${leadId}`);

        // 2. Simular Login para obter Token de Admin (para mover o card)
        console.log('\nStep 2: Obtendo autenticação...');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'master@vox2you.com.br',
            password: 'master_password_2026' // Senha padrão definida no seeder
        });
        const token = loginRes.data.token;

        // 3. Mover Lead para "Matriculados" (WON)
        console.log('\nStep 3: Movendo Lead para "Matriculados" (WON)...');
        const moveRes = await axios.put(`${BASE_URL}/crm/leads/${leadId}/move`, {
            status: 'won',
            proposedValue: '2500,00'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Lead movido com sucesso!');
        console.log('\n--- RESULTADO NO SERVIDOR ---');
        console.log('Verifique os logs do terminal do servidor (npm run dev) para visualizar o output do [OFFLINE CONVERSION DETECTED].');

    } catch (error) {
        console.error('❌ Erro na simulação:', error.response?.data || error.message);
    }
}

simulateConversionFlow();
