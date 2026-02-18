require('dotenv').config();
const Hapi = require('@hapi/hapi');
const { connectDB } = require('./db');

const userRoutes = require('./routes/userRoute');
const customerRoutes = require('./routes/customerRoute');

const init = async () => {
    const server = Hapi.server({
        port: process.env.PORT || 3000,
        host: process.env.HOST || '0.0.0.0',
        routes: {
            cors: {
                origin: process.env.CORS_ORIGIN
                    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
                    : ['http://localhost:5173', 'http://localhost:3000'],
                credentials: true,
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