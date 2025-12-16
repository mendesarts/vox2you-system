const fetch = require('node-fetch'); // Ensure node-fetch is available or use native check
// Creating a simple script using standard http if fetch isn't guaranteed, but node > 18 has fetch.
// Let's assume node environment has access to https module if fetch fails, but let's try a simple fetch assuming modern node.

async function testLogin() {
    const url = 'https://vox2you-system-978034491078.us-central1.run.app/api/auth/login';
    const credentials = {
        email: 'novo.admin@voxflow.com',
        password: 'Vox2you@2025'
    };

    console.log(`🚀 Tentando login em: ${url}`);
    console.log(`👤 Credenciais: ${credentials.email} / ${credentials.password}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        console.log(`\n📡 Status Code: ${response.status}`);

        if (response.ok) {
            console.log('✅ LOGIN BEM SUCEDIDO!');
            console.log('🔑 Token recebido:', data.token ? 'SIM (Oculto)' : 'NÃO');
            console.log('👤 Usuário:', data.user ? `${data.user.name} (${data.user.role})` : 'Dados ausentes');
        } else {
            console.log('❌ FALHA NO LOGIN');
            console.log('⚠️ Erro:', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('❌ Erro de requisição:', error.message);
    }
}

testLogin();
