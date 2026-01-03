require('dotenv').config();
const Hapi = require('@hapi/hapi');
const { connectDB } = require('./db');

const userRoutes = require('./routes/userRoute');
const customerRoutes = require('./routes/customerRoute');

const init = async () => {
    const server = Hapi.server({
        port: process.env.PORT,
        host: 'localhost',
        routes: {
            cors: {
                origin: ['*'],
                headers: ['Accept', 'Authorization', 'Content-Type'],
                additionalHeaders: ['X-Requested-With'],
            },
        },
    });

    await connectDB();

    server.route({
        method: 'GET',
        path: '/health',
        handler: (request, h) => {
            return { status: 'ok' };
        },
    });

    server.route(userRoutes);
    server.route(customerRoutes);

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();