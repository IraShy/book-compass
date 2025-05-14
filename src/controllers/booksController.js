const db = require("../../db");
const fetchBookFromGoogle = require("../utils/fetchBookFromGoogle");

/**
 * Find a book in the database or add it from Google Books API
 */
async function findOrAddBook(req, res) {
  try {
    let book;

    // 1. Check by title and author (if provided) in the db
    let query = `SELECT * FROM books WHERE LOWER(title) = LOWER($1)`;
    let params = [req.decodedTitle];
    
    // Add author condition if provided, with case-insensitive matching
    if (req.decodedAuthor) {
      // Use array_to_string and LOWER to perform case-insensitive search within the authors array
      query += ` AND EXISTS (
        SELECT 1 FROM unnest(authors) AS author 
        WHERE LOWER(author) = LOWER($2)
      )`;
      params.push(req.decodedAuthor);
    }
    
    query += ` LIMIT 1`;
    const localResult = await db.query(query, params);

    if (localResult.rows.length > 0) {
      return res.json({ source: "database", book: localResult.rows[0] });
    }

    // 2. Fetch from Google Books API
    book = await fetchBookFromGoogle(req.decodedTitle, req.decodedAuthor);

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
