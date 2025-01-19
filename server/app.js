
require('dotenv').config();
const express = require('express');
const corsMiddleware = require('./middleware/cors');
const gameRoutes = require('./routes/gameRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(corsMiddleware);

// Routes
app.use('/api', gameRoutes);

module.exports = app;
