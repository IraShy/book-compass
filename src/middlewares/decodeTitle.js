const logger = require("../utils/logger");

/**
 * Middleware to decode and validate book search parameters
 */
function decodeSearchParams(req, res, next) {
  try {
    const rawTitle = req.query.title;
    const rawAuthor = req.query.author;

    if (!rawTitle) {
      return res.status(400).json({ error: "Title is required" });
    }

    req.decodedTitle = decodeURIComponent(rawTitle).trim();

    if (rawAuthor) {
      req.decodedAuthor = decodeURIComponent(rawAuthor).trim();
    }

    next();
  } catch (err) {
    logger.error("Parameter decoding error:", err);
    return res.status(400).json({ error: "Malformed search parameters" });
  }
}

module.exports = { decodeSearchParams };
