const https = require('https');

async function testLoginNative() {
    const data = JSON.stringify({
        email: 'novo.admin@voxflow.com',
        password: 'Vox2you@2025'
    });

    const options = {
        hostname: 'vox2you-system-978034491078.us-central1.run.app',
        port: 443,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    console.log(`🚀 Tentando login via HTTPS em: ${options.hostname}${options.path}`);

    const req = https.request(options, (res) => {
        let body = '';
        console.log(`📡 Status Code: ${res.statusCode}`);

        res.on('data', (d) => { body += d; });

        res.on('end', () => {
            try {
                const parsed = JSON.parse(body);
                if (res.statusCode === 200 || res.statusCode === 201) {
                    console.log('✅ LOGIN BEM SUCEDIDO!');
                    console.log('🔑 Token recebido?', parsed.token ? 'SIM' : 'NÃO');
                    console.log('👤 Usuário:', parsed.user ? `${parsed.user.name} (${parsed.user.role})` : 'N/A');
                } else {
                    console.log('❌ FALHA NO LOGIN');
                    console.log('⚠️ Resposta:', JSON.stringify(parsed, null, 2));
                }
            } catch (e) {
                console.log('⚠️ Resposta não-JSON:', body);
            }
        });
    });

    req.on('error', (error) => {
        console.error('❌ Erro de conexão:', error);
    });

    req.write(data);
    req.end();
}

testLoginNative();
