// utils/catchAsync.js
// High-order function to catch errors in async route handlers and pass them to Hapi's error handling

function preHandler(handler) {
    return async function (request, h) {
        try {
            return await handler(request, h);
        } catch (err) {
            console.error('Error:', err);
            throw err;
        }
    };
}

module.exports = preHandler;