// src/middleware/cors.js
const cors = require('cors');

const corsMiddleware = cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST'],
    credentials: true
});

module.exports = corsMiddleware;