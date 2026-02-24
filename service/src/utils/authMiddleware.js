const { verify } = require('./jwt');
const { validateSession } = require('../repositories/sessionRepository');

// Middleware to check if user is authenticated admin
const authMiddleware = async (request, h) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return h.response({ error: 'Unauthorized' }).code(401).takeover();
    }

    const token = authHeader.substring(7);
    const decoded = verify(token);

    if (!decoded) {
        return h.response({ error: 'Unauthorized - Invalid or expired token' }).code(401).takeover();
    }

    if (decoded.role !== 'user') {
        return h.response({ error: 'Forbidden - Admin access required' }).code(403).takeover();
    }

    request.auth = decoded;
    return h.continue;
};

// Middleware to check if customer session is valid
const customerAuthMiddleware = async (request, h) => {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return h.response({ error: 'Unauthorized' }).code(401).takeover();
    }

    const token = authHeader.substring(7);
    const decoded = verify(token);

    if (!decoded) {
        return h.response({ error: 'Unauthorized - Invalid or expired token' }).code(401).takeover();
    }

    if (decoded.role !== 'customer') {
        return h.response({ error: 'Forbidden - Customer access required' }).code(403).takeover();
    }

    // Validate session
    const session = await validateSession(token);
    if (!session) {
        return h.response({
            error: 'Session expired or invalid',
            message: 'Your session has been terminated. Please login again.',
            code: 'SESSION_EXPIRED'
        }).code(401).takeover();
    }

    request.auth = decoded;
    request.session = session;
    return h.continue;
};

module.exports = { authMiddleware, customerAuthMiddleware };

