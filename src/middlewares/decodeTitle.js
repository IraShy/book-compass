/**
 * Middleware to decode and validate book title from request
 */
function decodeTitle(req, res, next) {
  try {
    const rawTitle = req.query.title;

    if (!rawTitle) {
      return res.status(400).json({ error: "Title is required" });
    }

    req.decodedTitle = decodeURIComponent(rawTitle).trim();
    next();
  } catch (err) {
    console.error("Title decoding error:", err);
    return res.status(400).json({ error: "Malformed title parameter" });
  }
}

module.exports = { decodeTitle };
