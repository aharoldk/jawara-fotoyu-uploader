const Joi = require('joi');
const preHandler = require('../utils/preHandler');
const userService = require('../services/userService');

async function loginUser(request, h) {
    const payload = request.payload;

    return userService.loginUser(payload.username, payload.password);
}

module.exports = [
    {
        method: 'POST',
        path: '/api/users/login',
        options: {
            validate: {
                payload: Joi.object({
                    username: Joi.string().required(),
                    password: Joi.string().required()
                })
            }
        },
        handler: preHandler(loginUser),
    },
];