const User = require('../models/user');

async function findUserByUsernameAndPassword(username, password) {
    return await User.findOne({ username, password });
}

async function findUserById(id) {
    return await User.findById(id);
}

async function createUser(userData) {
    const user = new User(userData);
    return await user.save();
}

async function updateUser(id, userData) {
    return await User.findByIdAndUpdate(id, userData, { new: true });
}

async function deleteUser(id) {
    return await User.findByIdAndDelete(id);
}

module.exports = {
    findUserByUsernameAndPassword,
    findUserById,
    createUser,
    updateUser,
    deleteUser,
};

