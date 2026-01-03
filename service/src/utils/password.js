const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;
const DEFAULT_PASSWORD = 'P@ssw0rd123';

async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
}

async function getDefaultPasswordHash() {
    return await hashPassword(DEFAULT_PASSWORD);
}

module.exports = {
    hashPassword,
    comparePassword,
    getDefaultPasswordHash,
    DEFAULT_PASSWORD,
};

