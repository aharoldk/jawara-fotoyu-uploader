const { findCustomerByUsername } = require('../repositories/customerRepository');
const { sign } = require('../utils/jwt');

async function loginCustomer(username, password) {
    const customer = await findCustomerByUsername(username);
    if (!customer || customer.password !== password) {
        throw new Error('Invalid credentials');
    }

    const token = sign({ id: customer._id, role: 'customer' });

    // Return token and customer details (exclude password)
    const customerDetails = {
        id: customer._id,
        username: customer.username,
        city: customer.city,
        whatsapp: customer.whatsapp,
        price: customer.price,
        description: customer.description,
        location: customer.location,
        subscriptionExpiredAt: customer.subscriptionExpiredAt,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
    };

    return { token, customer: customerDetails };
}

module.exports = { loginCustomer };

