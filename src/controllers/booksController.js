const db = require("../../db");
const fetchBookFromGoogle = require("../utils/fetchBookFromGoogle");

/**
 * Find a book in the database or add it from Google Books API
 */
async function findOrAddBook(req, res) {
  try {
    const { title, author } = req.query;
    let book;

    // 1. Check by title in the db
    const localResult = await db.query(
      `SELECT * FROM books WHERE LOWER(title) = LOWER($1) LIMIT 1`,
      [req.decodedTitle]
    );

    if (localResult.rows.length > 0) {
      return res.json({ source: "database", book: localResult.rows[0] });
    }

    // 2. Fetch from Google Books API
    book = await fetchBookFromGoogle(title, author);

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    // 3. Check by google_books_id in the db
    const existingByGoogleId = await db.query(
      `SELECT * FROM books WHERE google_books_id = $1 LIMIT 1`,
      [book.google_books_id]
    );

    if (existingByGoogleId.rows.length > 0) {
      return res.json({ source: "database", book: existingByGoogleId.rows[0] });
    }

    // 4. Insert new book into db
    const insertResult = await db.query(
      `INSERT INTO books (google_books_id, title, authors, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [book.google_books_id, book.title, book.authors, book.description]
    );

    return res
      .status(201)
      .json({ source: "google_api", book: insertResult.rows[0] });
  } catch (err) {
    console.error("Book search/add error:", err);

    if (err.code === "23505" && book?.google_books_id) {
      try {
        const fallback = await db.query(
          `SELECT * FROM books WHERE google_books_id = $1`,
          [book.google_books_id]
        );
        if (fallback.rows.length > 0) {
          return res.json({ source: "database", book: fallback.rows[0] });
        }
      } catch (fallbackErr) {
        console.error("Fallback query error:", fallbackErr);
      }
    }

    return res.status(500).json({ error: "Failed to process book request" });
  }
}

module.exports = { findOrAddBook };
