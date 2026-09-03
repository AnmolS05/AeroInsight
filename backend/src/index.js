require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const flightRoutes = require('./routes/flightRoutes');
const errorHandler = require('./middlewares/errorHandler');
require('./config/database'); // Initialize DB

const app = express();
const PORT = process.env.PORT || 10000;

// Security Middlewares
app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' })); // Reduced payload limit from 50mb to 10mb for safety
app.use(morgan('dev')); // Add request logging

app.use('/api/flights', flightRoutes);

app.get('/', (req, res) => {
    res.send('AeroInsight Backend API is running.');
});

// Global Error Handler
app.use(errorHandler);

// Start server if executed directly (e.g., node src/index.js), bypass if imported (e.g., by Vercel/Serverless)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });
}

module.exports = app;

// Global error handlers for uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! Shutting down...', err);
    // In a real production app, we would close the server gracefully here before exiting
    process.exit(1);
});
