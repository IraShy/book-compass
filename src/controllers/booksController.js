const db = require("../../db");
const fetchBookFromGoogle = require("../utils/fetchBookFromGoogle");
const logger = require("../utils/logger");

/**
 * Find a book in the database or add it from Google Books API
 */
async function findOrAddBook(req, res) {
  try {
    let book;

    const logContext = {
      title: req.decodedTitle,
      author: req.decodedAuthor || "not provided",
    };

    logger.debug("Book search initiated", logContext);

    // 1. Check by title and author (if provided) in the db
    let query = `SELECT * FROM books WHERE LOWER(title) = LOWER($1)`;
    let params = [req.decodedTitle];

    if (req.decodedAuthor) {
      query += ` AND EXISTS (
        SELECT 1 FROM unnest(authors) AS author 
        WHERE LOWER(author) = LOWER($2)
      )`;
      params.push(req.decodedAuthor);
    }

    query += ` LIMIT 1`;
    const localResult = await db.query(query, params);

    if (localResult.rows.length > 0) {
      logger.info("Book found in database", {
        bookId: localResult.rows[0].id,
        title: localResult.rows[0].title,
      });
      return res.json({ source: "database", book: localResult.rows[0] });
    }

    // 2. If doesn't exist in the db, fetch from Google Books API
    logger.debug("Book not found in database, searching Google Books API");

    book = await fetchBookFromGoogle(req.decodedTitle, req.decodedAuthor);

    if (!book) {
      logger.info("Book not found in Google Books API", logContext);
      return res.status(404).json({ error: "Book not found" });
    }

    logger.info("Book found in Google Books API", {
      googleBooksId: book.google_books_id,
      title: book.title,
    });

    // 3. Check by google_books_id in the db
    const existingByGoogleId = await db.query(
      `SELECT * FROM books WHERE google_books_id = $1 LIMIT 1`,
      [book.google_books_id]
    );

    if (existingByGoogleId.rows.length > 0) {
      logger.debug(
        `Book already exists in database by Google Books ID ${book.google_books_id}`
      );
      return res.json({ source: "database", book: existingByGoogleId.rows[0] });
    }

    // 4. Insert new book into db
    const insertResult = await db.query(
      `INSERT INTO books (google_books_id, title, authors, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [book.google_books_id, book.title, book.authors, book.description]
    );

    logger.info("New book added to database", {
      bookId: insertResult.rows[0].id,
      googleBooksId: book.google_books_id,
      title: book.title,
      authors: book.authors,
    });

    return res
      .status(201)
      .json({ source: "google_api", book: insertResult.rows[0] });
  } catch (err) {
    if (err.code === "23505" && book?.google_books_id) {
      logger.warn("Duplicate book insertion attempt", {
        googleBooksId: book.google_books_id,
      });

      try {
        const fallback = await db.query(
          `SELECT * FROM books WHERE google_books_id = $1`,
          [book.google_books_id]
        );
        if (fallback.rows.length > 0) {
          return res.json({ source: "database", book: fallback.rows[0] });
        }
      } catch (fallbackErr) {
        logger.error("Fallback query failed", {
          error: fallbackErr.message,
          googleBooksId: book.google_books_id,
        });
      }
    }

    logger.error("Book search/add operation failed", {
      ...logContext,
      error: err.message,
      stack: err.stack,
    });

    return res.status(500).json({ error: "Failed to process book request" });
  }
}

module.exports = { findOrAddBook };
