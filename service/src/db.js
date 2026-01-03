require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;

async function connectDB() {
    if (mongoose.connection.readyState === 0) {
        try {
            await mongoose.connect(uri, {
                authSource: process.env.MONGODB_AUTH_SOURCE || 'admin',
            });
            console.log('Connected to MongoDB via Mongoose');
        } catch (error) {
            console.error('MongoDB connection error:', error.message);
            console.error('Please check your MONGODB_URI in .env file');
            console.error('Expected format: mongodb://username:password@host:port/database');
            throw error;
        }
    }
    return mongoose.connection;
}

async function disconnectDB() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

module.exports = { connectDB, disconnectDB };
