const Customer = require('../models/customer');
const { hashPassword, getDefaultPasswordHash } = require('../utils/password');

async function findCustomerByUsername(username) {
    return await Customer.findOne({ username });
}

async function findCustomerById(id) {
    return await Customer.findById(id).select('-password');
}

async function createCustomer(customerData) {
    const customer = new Customer(customerData);

    customer.password = await getDefaultPasswordHash();

    await customer.save();

    return Customer.findById(customer._id).select('-password');
}

async function updateCustomer(id, customerData) {
    // Hash password if provided and not empty
    if (customerData.password && customerData.password.trim() !== '') {
        customerData.password = await hashPassword(customerData.password);
    } else {
        // Remove password from update if it's empty
        delete customerData.password;
    }

    return await Customer.findByIdAndUpdate(
        id,
        customerData,
        { new: true, runValidators: true }
    ).select('-password');
}

async function deleteCustomer(id) {
    return await Customer.findByIdAndDelete(id);
}

async function findAllCustomers() {
    return await Customer.find({}).select('-password').sort({ createdAt: -1 });
}

async function updateSubscription(id, subscriptionType, subscriptionExpiredAt) {
    const updateData = { subscriptionExpiredAt };

    // Only update subscriptionType if it's provided
    if (subscriptionType) {
        updateData.subscriptionType = subscriptionType;
    }

    return await Customer.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
    ).select('-password');
}

module.exports = {
    findCustomerByUsername,
    findCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    findAllCustomers,
    updateSubscription,
};

