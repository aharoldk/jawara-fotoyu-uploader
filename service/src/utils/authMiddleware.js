const { verify } = require('./jwt');
const { validateSession, invalidateAllSessions } = require('../repositories/sessionRepository');
const { findCustomerById } = require('../repositories/customerRepository');

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

    // Check subscription expiry
    const customer = await findCustomerById(decoded.id);
    if (!customer) {
        return h.response({ error: 'Unauthorized', message: 'Customer not found.' }).code(401).takeover();
    }

    if (!customer.subscriptionExpiredAt || new Date(customer.subscriptionExpiredAt) <= new Date()) {
        await invalidateAllSessions(decoded.username);
        return h.response({
            error: 'Subscription expired',
            message: 'Your subscription has expired. Please renew to continue.',
            code: 'SUBSCRIPTION_EXPIRED'
        }).code(401).takeover();
    }

    request.auth = decoded;
    request.session = session;
    return h.continue;
};

module.exports = { authMiddleware, customerAuthMiddleware };

