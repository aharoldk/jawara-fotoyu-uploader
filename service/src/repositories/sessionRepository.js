const Session = require('../models/session');

// Create a new session and invalidate all other sessions for this customer
async function createSession(customerId, token, deviceInfo = null, ipAddress = null) {
    // Invalidate all existing sessions for this customer
    await Session.updateMany(
        { customerId, isActive: true },
        { isActive: false }
    );

    // Create new session
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const session = new Session({
        customerId,
        token,
        deviceInfo,
        ipAddress,
        isActive: true,
        expiresAt,
    });

    await session.save();
    return session;
}

// Check if session is valid
async function validateSession(token) {
    const session = await Session.findOne({
        token,
        isActive: true,
        expiresAt: { $gt: new Date() },
    });

    if (session) {
        // Update last activity
        session.lastActivity = new Date();
        await session.save();
        return session;
    }

    return null;
}

// Invalidate session (logout)
async function invalidateSession(token) {
    await Session.updateOne(
        { token },
        { isActive: false }
    );
}

// Invalidate all sessions for a customer
async function invalidateAllSessions(customerId) {
    await Session.updateMany(
        { customerId },
        { isActive: false }
    );
}

// Get active session for customer
async function getActiveSession(customerId) {
    return await Session.findOne({
        customerId,
        isActive: true,
        expiresAt: { $gt: new Date() },
    });
}

module.exports = {
    createSession,
    validateSession,
    invalidateSession,
    invalidateAllSessions,
    getActiveSession,
};

