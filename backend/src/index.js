require('dotenv').config();
const express = require('express');
const cors = require('cors');
const flightRoutes = require('./routes/flightRoutes');
require('./config/database'); // Initialize DB

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/flights', flightRoutes);

app.get('/', (req, res) => {
    res.send('AeroInsight Backend API is running.');
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
