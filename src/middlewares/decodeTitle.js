/**
 * Middleware to decode and validate book search parameters
 */
function decodeSearchParams(req, res, next) {
  try {
    const rawTitle = req.query.title;
    const rawAuthor = req.query.author;

    if (!rawTitle) {
      req.log.debug("Book search attempt without title");
      return res.status(400).json({ error: "Title is required" });
    }

    req.decodedTitle = decodeURIComponent(rawTitle).trim();

    if (rawAuthor) {
      req.decodedAuthor = decodeURIComponent(rawAuthor).trim();
    }

    next();
  } catch (err) {
    req.log.error("Parameter decoding error", { error: err.message });
    return res.status(400).json({ error: "Malformed search parameters" });
  }
}

module.exports = { decodeSearchParams };
