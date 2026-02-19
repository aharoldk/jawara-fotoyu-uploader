const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: false,
    },
    whatsapp: {
        type: String,
        required: false,
    },
    price: {
        type: Number,
        required: false,
    },
    description: {
        type: String,
        required: false,
    },
    concurrentTabs: {
        type: Number,
        required: false,
        default: 1,
        min: 1,
        max: 10,
    },
    subscriptionExpiredAt: {
        type: Date,
        required: false,
        default: null,
    },
}, {
    timestamps: true,
    collection: 'customers',
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer;

