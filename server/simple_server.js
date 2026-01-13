const http = require('http');
console.log('Starting simple server...');
const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Hello');
});
server.listen(3001, () => {
    console.log('Simple server listening on 3001');
});
