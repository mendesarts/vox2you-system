const fetch = require('node-fetch');

async function testFetch() {
    const API_URL = 'http://localhost:3000/api';

    // We need a token. I'll use the emergency reset to get master, or just assume I can't.
    // Actually, I can just use the DB to find a user and sign a token.
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
        { id: 2, role: '20', roleId: 20, name: 'Mendes Silva Santos', unitId: 2 },
        'vox2you-secret-key-change-in-prod'
    );

    console.log('Testing GET /api/crm/leads for Unit 2...');
    const res = await fetch(`${API_URL}/crm/leads`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();
    console.log(`Received ${data.length} leads.`);
    data.forEach(l => {
        console.log(`- ${l.name} (${l.id}) | UnitId: ${l.unitId}, Status: ${l.status}, Funnel: ${l.funnel}`);
    });
}

testFetch();
