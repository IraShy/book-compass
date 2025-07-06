const logger = require("../utils/logger");
const onFinished = require("on-finished");

/**
 * Middleware to log HTTP requests
 */
function requestLogger(req, res, next) {
  req.id = req.id || Math.random().toString(36).substring(2, 9);

  // Create request-scoped logger with requestId
  req.log = logger.child({ requestId: req.id });

  const reqData = {
    method: req.method,
    url: req.originalUrl || req.url,
  };

  req.log.info("Request started", reqData);

  const start = Date.now();

  onFinished(res, (err) => {
    const duration = Date.now() - start;

    const resData = {
      ...reqData,
      statusCode: res.statusCode,
      responseTime: `${duration}ms`,
    };

    if (err) {
      req.log.error("Request failed with error", {
        ...resData,
        error: err.message,
        stack: err.stack,
      });
    } else {
      // Determine logging level based on status code
      if (res.statusCode >= 500) {
        req.log.error("Request completed with server error", resData);
      } else if (res.statusCode >= 400) {
        req.log.warn("Request completed with client error", resData);
      } else if (res.statusCode >= 300) {
        req.log.info("Request completed with redirect", resData);
      } else {
        req.log.info("Request completed successfully", resData);
      }
    }
  });

  next();
}

module.exports = { requestLogger };
