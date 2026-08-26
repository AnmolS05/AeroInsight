const express = require('express');
const router = express.Router();
const flightController = require('../controllers/flightController');
const { validateTelemetry, validateFlightId } = require('../middlewares/validate');

router.post('/', validateTelemetry, flightController.uploadFlight);
router.get('/', flightController.getFlights);
router.get('/:id', validateFlightId, flightController.getFlightData);
router.get('/:id/report', validateFlightId, flightController.getFlightReport);
router.delete('/:id', validateFlightId, flightController.deleteFlight);

module.exports = router;
