const jwt = require('jsonwebtoken');

const JWT_SECRET = 'vox2you-secret-key-change-in-prod';

const token = jwt.sign({
    id: 'master-uuid-123',
    name: 'Master User',
    email: 'master@voxflow.com.br',
    role: 'master',
    roleId: 1,
    unitId: null
}, JWT_SECRET);

console.log(token);
