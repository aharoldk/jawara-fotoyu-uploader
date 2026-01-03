const Customer = require('../models/customer');

async function findCustomerByUsername(username) {
    return await Customer.findOne({ username });
}

async function findCustomerById(id) {
    return await Customer.findById(id);
}

async function createCustomer(customerData) {
    const customer = new Customer(customerData);
    return await customer.save();
}

async function updateCustomer(id, customerData) {
    return await Customer.findByIdAndUpdate(id, customerData, { new: true });
}

async function deleteCustomer(id) {
    return await Customer.findByIdAndDelete(id);
}

async function findAllCustomers() {
    return await Customer.find({});
}

module.exports = {
    findCustomerByUsername,
    findCustomerById,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    findAllCustomers,
};

