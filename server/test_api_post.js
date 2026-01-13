const fetch = require('node-fetch'); // Assuming installed, or use http
const http = require('http');

async function testPost() {
    const data = JSON.stringify({
        name: "API Test Lead",
        phone: "551199998888",
        email: "test@example.com",
        source: "API Test",
        unitId: 1,
        status: "new",
        value: 1000,
        consultant_id: 1, // Master
        tags: ["Teste"],
        contact: { name: "Ignored", phone: "Ignored" } // Extra field to test destructuring
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/crm/leads',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length,
            // 'Authorization': 'Bearer ...' // I need a token!
        }
    };

    // I need a TOKEN.
    // I can generate one using jsonwebtoken if I have the secret.
    // SECRET is 'vox2you-secret-key-change-in-prod' (found in server/middleware/auth.js)

    // Let's generate a token.
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: 1, name: "Master", roleId: 1, unitId: 1 }, 'vox2you-secret-key-change-in-prod', { expiresIn: '1h' });

    options.headers['Authorization'] = 'Bearer ' + token;

    const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`BODY: ${body}`);
        });
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });

    req.write(data);
    req.end();
}

testPost();
