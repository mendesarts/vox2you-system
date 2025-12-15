const jwt = require('jsonwebtoken');

const JWT_SECRET = 'vox2you-secret-key-change-in-prod';

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1]; // Bearer <token>

        if (!token) {
            return res.status(401).json({ message: 'Autenticação necessária' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
};
