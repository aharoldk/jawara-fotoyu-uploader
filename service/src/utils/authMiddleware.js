const { verify } = require('./jwt');

// Middleware to check if user is authenticated admin
const authMiddleware = async (request, h) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return h.response({ error: 'Unauthorized' }).code(401).takeover();
    }

    const token = authHeader.substring(7);
    const decoded = verify(token);

    if (!decoded || decoded.role !== 'user') {
        return h.response({ error: 'Forbidden - Admin access required' }).code(403).takeover();
    }

    request.auth = decoded;
    return h.continue;
};

module.exports = { authMiddleware };

