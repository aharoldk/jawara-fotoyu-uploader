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
        min: 50000
    },
    description: {
        type: String,
        required: false,
        default: null,
    },
    fotoTree: {
        type: String,
        required: false,
        default: null,
    },
    concurrentTabs: {
        type: Number,
        required: false,
        default: 1,
        min: 1,
        max: 1000,
    },
    batchSize: {
        type: Number,
        required: false,
        default: 10,
        min: 10,
        max: 2000,
    },
    subscriptionType: {
        type: String,
        required: false,
        enum: ['Normal', 'Pro'],
        default: 'Normal',
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

