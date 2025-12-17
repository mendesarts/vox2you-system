const http = require('http');

async function testLoginLocal() {
    const data = JSON.stringify({
        email: 'novo.admin@voxflow.com',
        password: 'Vox2you@2025'
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    console.log(`🚀 Tentando login via HTTP Local em: http://${options.hostname}:${options.port}${options.path}`);

    const req = http.request(options, (res) => {
        let body = '';
        console.log(`📡 Status Code: ${res.statusCode}`);

        res.on('data', (d) => { body += d; });

        res.on('end', () => {
            try {
                const parsed = JSON.parse(body);
                if (res.statusCode === 200 || res.statusCode === 201) {
                    console.log('✅ LOGIN BEM SUCEDIDO!');
                    console.log('key Token recebido?', parsed.token ? 'SIM' : 'NÃO');
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
        console.error('❌ Erro de conexão:', error.message);
    });

    req.write(data);
    req.end();
}

testLoginLocal();
