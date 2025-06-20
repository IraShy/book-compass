const logger = require("../utils/logger");
const onFinished = require("on-finished");

/**
 * Middleware to log HTTP requests after completion
 */
function requestLogger(req, res, next) {
  req.id = req.id || Math.random().toString(36).substring(2, 9);

  const start = Date.now();

  onFinished(res, (err) => {
    const duration = Date.now() - start;

    const logData = {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTime: `${duration}ms`,
    };

    if (err) {
      // Log errors specifically
      logger.error("Request failed with error", {
        ...logData,
        error: err.message,
        stack: err.stack,
      });
    } else {
      // Determine logging level based on status code
      if (res.statusCode >= 500) {
        logger.error("Request completed with server error", logData);
      } else if (res.statusCode >= 400) {
        logger.warn("Request completed with client error", logData);
      } else if (res.statusCode >= 300) {
        logger.info("Request completed with redirect", logData);
      } else {
        logger.info("Request completed successfully", logData);
      }
    }
  });

  next();
}

module.exports = { requestLogger };
