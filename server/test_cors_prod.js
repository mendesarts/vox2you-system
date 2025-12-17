const https = require('https');

async function testCorsLogin() {
    return new Promise((resolve) => {
        const data = JSON.stringify({ email: 'novo.admin@voxflow.com', password: '123456' });
        const options = {
            hostname: 'vox2you-system-978034491078.us-central1.run.app',
            port: 443,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length,
                'Origin': 'https://meuvoxflow.vercel.app', // SIMULANDO O BROWSER
                'Referer': 'https://meuvoxflow.vercel.app/'
            }
        };

        console.log('🚀 Testando envio COM HEADER ORIGIN (Simulando Vercel)...');

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                console.log(`\n📡 Status: ${res.statusCode}`);
                console.log('Headers Resposta:', JSON.stringify(res.headers, null, 2));

                if (res.statusCode === 200) {
                    console.log('✅ LOGIN SUCESSO com CORS!');
                } else {
                    console.log('❌ FALHA:', body);
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error('❌ Erro de Rede:', e.message);
            resolve();
        });

        req.write(data);
        req.end();
    });
}

testCorsLogin();
