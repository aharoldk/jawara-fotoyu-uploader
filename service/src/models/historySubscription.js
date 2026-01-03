const mongoose = require('mongoose');

const historySubscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
    },
    action: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
}, {
    collection: 'history_subscription',
});

const HistorySubscription = mongoose.model('HistorySubscription', historySubscriptionSchema);

module.exports = HistorySubscription;

