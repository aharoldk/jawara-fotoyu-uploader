const Boom = require('@hapi/boom');
const { findCustomerByUsername } = require('../repositories/customerRepository');
const { sign } = require('../utils/jwt');
const { comparePassword } = require('../utils/password');
const { createSession, getActiveSession } = require('../repositories/sessionRepository');

async function loginCustomer(username, password, deviceInfo = null, ipAddress = null) {
    const customer = await findCustomerByUsername(username);
    if (!customer) {
        throw Boom.unauthorized('Invalid credentials');
    }

    const isPasswordValid = await comparePassword(password, customer.password);
    if (!isPasswordValid) {
        throw Boom.unauthorized('Invalid credentials');
    }

    // Check if customer already has an active session
    const existingSession = await getActiveSession(customer._id);
    if (existingSession) {
        throw Boom.conflict('An active session already exists. Please logout from the other device first or Please talk with the administrator to terminate the existing session.');
    }

    const token = sign({ id: customer._id, role: 'customer' });

    // Create session
    await createSession(customer._id, token, deviceInfo, ipAddress);

    // Return token and customer details (exclude password)
    const customerDetails = {
        id: customer._id,
        username: customer.username,
        city: customer.city,
        whatsapp: customer.whatsapp,
        price: customer.price,
        description: customer.description,
        fotoTree: customer.fotoTree,
        concurrentTabs: customer.concurrentTabs,
        batchSize: customer.batchSize,
        subscriptionExpiredAt: customer.subscriptionExpiredAt,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
    };

    return { token, customer: customerDetails };
}

module.exports = { loginCustomer };

