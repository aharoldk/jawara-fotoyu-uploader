const Joi = require('joi');
const preHandler = require('../utils/preHandler');
const { authMiddleware, customerAuthMiddleware } = require('../utils/authMiddleware');
const customerService = require('../services/customerService');
const { invalidateSession } = require('../repositories/sessionRepository');
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
    const deviceInfo = request.headers['user-agent'] || 'Unknown Device';
    const ipAddress = request.info.remoteAddress || 'Unknown IP';

    return customerService.loginCustomer(payload.username, payload.password, deviceInfo, ipAddress);
}

async function logoutCustomer(request, h) {
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await invalidateSession(token);
    }

    return { message: 'Logged out successfully' };
}

async function validateCustomerSession(request, h) {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return h.response({
            valid: false,
            message: 'No token provided'
        }).code(200);
    }

    const token = authHeader.substring(7);
    const { verify } = require('../utils/jwt');
    const { validateSession } = require('../repositories/sessionRepository');

    // Verify JWT
    const decoded = verify(token);
    if (!decoded || decoded.role !== 'customer') {
        return h.response({
            valid: false,
            message: 'Invalid token'
        }).code(200);
    }

    // Validate session
    const session = await validateSession(token);
    if (!session) {
        return h.response({
            valid: false,
            message: 'Session expired or invalid',
            code: 'SESSION_EXPIRED'
        }).code(200);
    }

    return {
        valid: true,
        message: 'Session is valid',
        customerId: decoded.id
    };
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

async function invalidateCustomerSession(request, h) {
    const { id } = request.params;
    const { invalidateAllSessions } = require('../repositories/sessionRepository');

    await invalidateAllSessions(id);

    return { message: 'Customer session(s) invalidated successfully' };
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
    // Public logout endpoint
    {
        method: 'POST',
        path: '/api/customers/logout',
        handler: preHandler(logoutCustomer),
    },
    // Public validate session endpoint
    {
        method: 'POST',
        path: '/api/customers/validate-session',
        handler: preHandler(validateCustomerSession),
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
        path: '/api/admin/customers/{id}/subscription',
        options: {
            pre: [{ method: authMiddleware }],
            validate: {
                payload: subscriptionValidation,
            },
        },
        handler: preHandler(updateCustomerSubscription),
    },
    {
        method: 'POST',
        path: '/api/admin/customers/{id}/invalidate-session',
        options: {
            pre: [{ method: authMiddleware }],
        },
        handler: preHandler(invalidateCustomerSession),
    },
];

