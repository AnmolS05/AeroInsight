require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const flightRoutes = require('./routes/flightRoutes');
const errorHandler = require('./middlewares/errorHandler');
require('./config/database'); // Initialize DB

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
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
