const express = require('express');
const router = require('./server/routes/financial');
const app = express();
app.use(express.json());
app.use((req, res, next) => {
    req.user = { id: 1, unitId: 1, roleId: 1 }; // Mock user
    next();
});
app.use('/api/financial', router);
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: `NOT FOUND: ${req.originalUrl}` });
});

const request = require('http').request;
const server = app.listen(3001, () => {
    console.log('Test server on 3001');
    const req = request({
        hostname: 'localhost',
        port: 3001,
        path: '/api/financial/15',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
    }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('Response Status:', res.statusCode);
            console.log('Response Data:', data);
            server.close();
            process.exit(0);
        });
    });
    req.on('error', (e) => {
        console.error(e);
        server.close();
        process.exit(1);
    });
    req.write(JSON.stringify({ description: 'test' }));
    req.end();
});
