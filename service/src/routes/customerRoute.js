const Joi = require('joi');
const preHandler = require('../utils/preHandler');
const customerService = require('../services/customerService');

async function loginCustomer(request, h) {
    const payload = request.payload;

    return customerService.loginCustomer(payload.username, payload.password);
}

module.exports = [
    {
        method: 'POST',
        path: '/api/customers/login',
        options: {
            validate: {
                payload: Joi.object({
                    username: Joi.string().required(),
                    password: Joi.string().required(),
                }),
            },
        },
        handler: preHandler(loginCustomer),
    },
];

