const Joi = require('joi');
const preHandler = require('../utils/preHandler');
const { authMiddleware } = require('../utils/authMiddleware');
const customerService = require('../services/customerService');
const {
    findAllCustomers,
    findCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    updateSubscription,
} = require('../repositories/customerRepository');


async function loginCustomer(request, h) {
    const payload = request.payload;

    return customerService.loginCustomer(payload.username, payload.password);
}

async function getAllCustomers(request, h) {
    const customers = await findAllCustomers();
    return { customers };
}

async function getCustomer(request, h) {
    const { id } = request.params;
    const customer = await findCustomerById(id);

    if (!customer) {
        return h.response({ error: 'Customer not found' }).code(404);
    }

    return { customer };
}

async function createNewCustomer(request, h) {
    const customer = await createCustomer(request.payload);
    return h.response({ customer, message: 'Customer created successfully' }).code(201);
}

async function updateExistingCustomer(request, h) {
    const { id } = request.params;
    const customer = await updateCustomer(id, request.payload);

    if (!customer) {
        return h.response({ error: 'Customer not found' }).code(404);
    }

    return { customer, message: 'Customer updated successfully' };
}

async function deleteExistingCustomer(request, h) {
    const { id } = request.params;
    const customer = await deleteCustomer(id);

    if (!customer) {
        return h.response({ error: 'Customer not found' }).code(404);
    }

    return { message: 'Customer deleted successfully' };
}

async function updateCustomerSubscription(request, h) {
    const { id } = request.params;
    const { subscriptionExpiredAt } = request.payload;

    const customer = await updateSubscription(id, subscriptionExpiredAt);

    if (!customer) {
        return h.response({ error: 'Customer not found' }).code(404);
    }

    return { customer, message: 'Subscription updated successfully' };
}

const customerValidation = Joi.object({
    username: Joi.string().required(),
    city: Joi.string().allow('', null).optional(),
    whatsapp: Joi.string().allow('', null).optional(),
    price: Joi.number().min(0).allow(null).optional(),
    description: Joi.string().allow('', null).optional(),
    location: Joi.string().allow('', null).optional(),
    subscriptionExpiredAt: Joi.date().allow(null).optional(),
});

const updateCustomerValidation = Joi.object({
    username: Joi.string().optional(),
    city: Joi.string().allow('', null).optional(),
    whatsapp: Joi.string().allow('', null).optional(),
    price: Joi.number().min(0).allow(null).optional(),
    description: Joi.string().allow('', null).optional(),
    location: Joi.string().allow('', null).optional(),
    subscriptionExpiredAt: Joi.date().allow(null).optional(),
});

const subscriptionValidation = Joi.object({
    subscriptionExpiredAt: Joi.date().allow(null).required(),
});

module.exports = [
    // Public login endpoint
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
    // Admin CRUD endpoints
    {
        method: 'GET',
        path: '/api/customers',
        options: {
            pre: [{ method: authMiddleware }],
        },
        handler: preHandler(getAllCustomers),
    },
    {
        method: 'GET',
        path: '/api/customers/{id}',
        options: {
            pre: [{ method: authMiddleware }],
        },
        handler: preHandler(getCustomer),
    },
    {
        method: 'POST',
        path: '/api/customers',
        options: {
            pre: [{ method: authMiddleware }],
            validate: {
                payload: customerValidation,
            },
        },
        handler: preHandler(createNewCustomer),
    },
    {
        method: 'PUT',
        path: '/api/customers/{id}',
        options: {
            pre: [{ method: authMiddleware }],
            validate: {
                payload: updateCustomerValidation,
            },
        },
        handler: preHandler(updateExistingCustomer),
    },
    {
        method: 'DELETE',
        path: '/api/customers/{id}',
        options: {
            pre: [{ method: authMiddleware }],
        },
        handler: preHandler(deleteExistingCustomer),
    },
    {
        method: 'PATCH',
        path: '/api/customers/{id}/subscription',
        options: {
            pre: [{ method: authMiddleware }],
            validate: {
                payload: subscriptionValidation,
            },
        },
        handler: preHandler(updateCustomerSubscription),
    },
];

