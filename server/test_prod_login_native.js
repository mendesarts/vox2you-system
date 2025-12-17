const https = require('https');

async function testLoginProd(email, password) {
    return new Promise((resolve) => {
        const data = JSON.stringify({ email, password });
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

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', d => body += d);
            res.on('end', () => {
                resolve({ status: res.statusCode, body });
            });
        });

        req.on('error', (e) => resolve({ status: 500, error: e.message }));
        req.write(data);
        req.end();
    });
}

async function runTests() {
    console.log('🚀 Testando Login em PRODUÇÃO...\n');

    // Test 1: Master
    const res1 = await testLoginProd('novo.admin@voxflow.com', '123456');
    console.log(`👤 Master (${res1.status}):`, res1.status === 200 ? '✅ SUCESSO' : '❌ FALHA', res1.body.substring(0, 100));

    // Test 2: Franqueado
    const res2 = await testLoginProd('mendesarts@gmail.com', '123456');
    console.log(`👤 Franqueado (${res2.status}):`, res2.status === 200 ? '✅ SUCESSO' : '❌ FALHA', res2.body.substring(0, 100));
}

runTests();
