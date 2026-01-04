const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    },
    token: {
        type: String,
        required: true,
        unique: true,
    },
    deviceInfo: {
        type: String,
        required: false,
    },
    ipAddress: {
        type: String,
        required: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastActivity: {
        type: Date,
        default: Date.now,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
}, {
    timestamps: true,
    collection: 'sessions',
});

// Index for automatic cleanup of expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;

