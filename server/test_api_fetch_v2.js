const http = require('http');
const jwt = require('jsonwebtoken');

const token = jwt.sign(
    { id: 2, role: '20', roleId: 20, name: 'Mendes Silva Santos', unitId: 2 },
    'vox2you-secret-key-change-in-prod'
);

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/crm/leads',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const leads = JSON.parse(data);
            console.log(`Received ${leads.length} leads.`);
            leads.forEach(l => {
                console.log(`- ${l.name} (${l.id}) | UnitId: ${l.unitId}, Status: ${l.status}, Funnel: ${l.funnel}`);
            });
        } catch (e) {
            console.log('Error parsing JSON:', e.message);
            console.log('Raw data:', data.substring(0, 500));
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
