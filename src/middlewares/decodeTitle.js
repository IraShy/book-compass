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

    const titleParam = Array.isArray(rawTitle) ? rawTitle[0] : rawTitle;
    const authorParam = Array.isArray(rawAuthor) ? rawAuthor[0] : rawAuthor;

    req.decodedTitle = decodeURIComponent(titleParam).trim();

    if (authorParam) {
      req.decodedAuthor = decodeURIComponent(authorParam).trim();
    }

    next();
  } catch (err) {
    req.log.error("Parameter decoding error", { error: err.message });
    return res.status(400).json({ error: "Malformed search parameters" });
  }
}

module.exports = { decodeSearchParams };
