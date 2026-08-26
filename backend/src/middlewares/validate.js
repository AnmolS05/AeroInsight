const { z } = require('zod');

const telemetrySchema = z.array(
  z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    altitude: z.number().min(0),
    battery: z.number().min(0).max(100),
    issue: z.string().optional(),
    timestamp: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format" })
  })
).min(1, "Telemetry data cannot be empty");

exports.validateTelemetry = (req, res, next) => {
  try {
    req.body = telemetrySchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.statusCode = 400;
      error.message = 'Validation failed: ' + error.errors.map(e => e.message).join(', ');
      return next(error);
    }
    next(error);
  }
};
