const Boom = require('@hapi/boom');
const { findUserByUsernameAndPassword } = require('../repositories/userRepository');
const { sign } = require('../utils/jwt');

async function loginUser(username, password) {
    const user = await findUserByUsernameAndPassword(username, password);
    if (!user) {
        throw Boom.unauthorized('Invalid credentials');
    }

    const token = sign({ id: user._id, role: 'user' });

    // Return token and user details (exclude password)
    const userDetails = {
        id: user._id,
        username: user.username,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };

    return { token, user: userDetails };
}

module.exports = { loginUser };