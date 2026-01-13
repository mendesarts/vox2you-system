const fetch = require('node-fetch');

async function testLogin() {
    try {
        console.log('Testing Login...');
        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'mendes@active.com', password: '123' }) // Use a known user if possible or random
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Body:', text);
    } catch (e) {
        console.error('Fetch Error:', e.message);
    }
}

testLogin();
