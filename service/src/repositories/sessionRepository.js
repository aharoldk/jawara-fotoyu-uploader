const Session = require('../models/session');

// Create a new session and invalidate all other sessions for this customer
async function createSession(username, token, deviceInfo = null, ipAddress = null) {
    // Invalidate all existing sessions for this customer
    await Session.updateMany(
        { username, isActive: true },
        { isActive: false }
    );

    // Create new session
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const session = new Session({
        username,
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

// Invalidate all sessions for a username
async function invalidateAllSessions(username) {
    await Session.updateMany(
        { username },
        { isActive: false }
    );
}

// Get active session for username
async function getActiveSession(username) {
    return Session.findOne({
        username,
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

