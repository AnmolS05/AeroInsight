const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flightController');
const { validateTelemetry } = require('../middlewares/validate');

router.post('/', validateTelemetry, flightController.uploadFlight);
router.get('/', flightController.getFlights);
router.get('/:id', flightController.getFlightData);
router.get('/:id/report', flightController.getFlightReport);

module.exports = router;
