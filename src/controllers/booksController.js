const db = require("../../db");
const { getCachedBook, setCachedBook } = require("../services/bookCacheService");
const { fetchBookFromGoogle, findBookInDatabase, saveBookToDatabase } = require("../services/bookService");

async function findOrAddBook(req, res) {
  const startTime = Date.now();

  try {
    const { decodedTitle: title, decodedAuthors: authors } = req;

    req.log.debug("Book search initiated", { title, authors });

    // 1. Check cache
    const cachedBook = getCachedBook(title, authors);
    if (cachedBook) {
      req.log.info("Book found in cache", {
        id: cachedBook.google_books_id,
        responseTime: Date.now() - startTime,
      });
      return res.status(200).json({ source: "cache", book: cachedBook });
    }

    // 2. Not in cache -> check database
    const dbBook = await findBookInDatabase(title, authors);
    if (dbBook) {
      req.log.info("Book found in database", {
        id: dbBook.google_books_id,
        title: dbBook.title,
        authors: dbBook.authors,
        responseTime: Date.now() - startTime,
      });

      // Cache book data
      setCachedBook(title, authors, dbBook);
      return res.status(200).json({ source: "database", book: dbBook });
    }

    // 3. Not in db -> fetch from Google Books API
    req.log.info("Search Google Books API", { title, authors });

    const googleBook = await fetchBookFromGoogle(title, authors);
    if (!googleBook) {
      req.log.warn("Book not found", { title, authors });
      return res.status(404).json({ error: "Book not found" });
    }

    // 4. Save to database and cache
    const savedBook = await saveBookToDatabase(googleBook);
    if (!savedBook) {
      req.log.error("Failed to save book to database", { googleBooksId: googleBook.google_books_id });
      return res.status(500).json({ error: "Failed to save book" });
    }

    req.log.info("New book added", {
      googleBooksId: savedBook.google_books_id,
      title: savedBook.title,
      responseTime: Date.now() - startTime,
    });

    setCachedBook(title, authors, savedBook);

    return res.status(200).json({ source: "google_api", book: savedBook });
  } catch (error) {
    req.log.error("Book search failed", {
      error: error.message,
      stack: error.stack,
      title: req.decodedTitle,
      authors: req.decodedAuthors,
    });
    return res.status(500).json({ error: "Failed to process book request" });
  }
}

async function getBookById(req, res) {
  const { id } = req.params;

  try {
    const result = await db.query("SELECT * FROM books WHERE google_books_id = $1", [id]);

    if (result.rows.length === 0 || !result.rows[0]) {
      req.log.warn("Book not found in database by id", { id });
      return res.status(404).json({ error: "Book not found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    req.log.error("Database error fetching book by id", { error: err.message, id, stack: err.stack });
    return res.status(500).json({ error: "Failed to fetch book" });
  }
}

module.exports = { findOrAddBook, getBookById };
