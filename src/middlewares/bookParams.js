function decodeSearchParams(req, res, next) {
  try {
    const rawTitle = req.query.title;
    const rawAuthors = req.query.authors;

    if (!rawTitle) {
      req.log.debug("Book search attempt without title");
      return res.status(400).json({ error: "Title is required" });
    }

    if (!rawAuthors) {
      req.log.debug("Book search attempt without authors");
      return res.status(400).json({ error: "At least one author is required" });
    }

    req.decodedTitle = decodeURIComponent(rawTitle).trim();
    req.decodedAuthors = decodeURIComponent(rawAuthors)
      .split(",")
      .map((author) => author.trim())
      .filter(Boolean);

    if (req.decodedAuthors.length === 0) {
      return res.status(400).json({ error: "At least one valid author is required" });
    }

    next();
  } catch (err) {
    req.log.error("Parameter decoding error", { error: err.message });
    return res.status(400).json({ error: "Malformed search parameters" });
  }
}

module.exports = { decodeSearchParams };
