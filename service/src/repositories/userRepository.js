const User = require('../models/user');
const { comparePassword } = require('../utils/password');

async function findUserByUsernameAndPassword(username, password) {
    const user = await User.findOne({ username });
    if (!user) {
        return null;
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
        return null;
    }

    return user;
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

