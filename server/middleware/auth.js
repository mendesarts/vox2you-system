// ⚠️ ATTENTION: Read ARCHITECTURE_GUIDELINES.md in the root directory before modifying logic related to roles, units, or permissions. Always use numeric roleId [1, 10, etc.] and unitId.
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'vox2you-secret-key-change-in-prod';

module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ message: 'Autenticação necessária' });
        }
        const token = authHeader.split(' ')[1]; // Bearer <token>

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
};
