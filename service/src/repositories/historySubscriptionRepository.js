const HistorySubscription = require('../models/historySubscription');

async function logHistory(userId, customerId, action) {
    const history = new HistorySubscription({
        userId,
        customerId,
        action,
        timestamp: new Date(),
    });
    return await history.save();
}

async function findHistoryByCustomerId(customerId) {
    return await HistorySubscription.find({ customerId })
        .populate('userId', 'username')
        .populate('customerId', 'username')
        .sort({ timestamp: -1 });
}

async function findHistoryByUserId(userId) {
    return await HistorySubscription.find({ userId })
        .populate('userId', 'username')
        .populate('customerId', 'username')
        .sort({ timestamp: -1 });
}

async function findAllHistory() {
    return await HistorySubscription.find({})
        .populate('userId', 'username')
        .populate('customerId', 'username')
        .sort({ timestamp: -1 });
}

module.exports = {
    logHistory,
    findHistoryByCustomerId,
    findHistoryByUserId,
    findAllHistory,
};

