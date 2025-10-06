const db = require("../../db");
const logger = require("../utils/logger");

function isEnglish(book) {
  return book.volumeInfo?.language === "en";
}

async function findBookInDatabase(title, authors) {
  const searchAuthor = authors[0].toLowerCase();
  const lastName = searchAuthor.split(" ").pop();

  // Find book by partial title/author match, prefer books with longer descriptions
  const result = await db.query(
    `SELECT * FROM books 
     WHERE LOWER(title) LIKE '%' || LOWER($1) || '%'
     AND EXISTS (
       SELECT 1 FROM unnest(authors) AS author 
       WHERE LOWER(author) LIKE '%' || LOWER($2) || '%'
     )
     ORDER BY LENGTH(description) DESC NULLS LAST
     LIMIT 1`,
    [title, lastName]
  );

  if (result.rows.length === 0) {
    logger.warn("Book not found in database", { title, authors });
  }
  logger.debug("Book found in database", { book: result.rows[0] });
  return result.rows[0] || null;
}

async function saveBookToDatabase(book) {
  try {
    const result = await db.query(
      `INSERT INTO books (google_books_id, title, authors, description)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (google_books_id) DO UPDATE SET
         title = EXCLUDED.title,
         authors = EXCLUDED.authors,
         description = EXCLUDED.description,
         updated_at = NOW()
       RETURNING *`,
      [book.google_books_id, book.title, book.authors, book.description]
    );

    logger.debug("Book saved to database", { book: result.rows[0] });

    return result.rows[0];
  } catch (err) {
    logger.error("Database error", { error: err.message, book, stack: err.stack });
    throw new Error(`Failed to save book to database: ${err.message}`);
  }
}

async function fetchBookFromGoogle(title, authors) {
  if (!title || !authors?.length) return null;

  try {
    const query = `intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(authors[0])}`;
    logger.debug("Fetching book from Google Books API", { title, authors, query });
    const booksApiUrl = `https://www.googleapis.com/books/v1/volumes?q=${query}&orderBy=relevance&maxResults=5&langRestrict=en`;

    const response = await fetch(booksApiUrl);
    if (!response.ok) {
      logger.error("Google Books API error", { status: response.status, title, authors });
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();

    const books =
      data.items?.filter((book) => {
        const info = book.volumeInfo;
        return (
          isEnglish(book) &&
          info.description &&
          info.authors?.some((author) => author.toLowerCase().includes(authors[0].toLowerCase()))
        );
      }) || [];

    if (books.length === 0) {
      logger.warn("*bookService/fetchBookFromGoogle*: No matching books found on Google Books API", {
        title,
        authors,
      });

      return null;
    }

    const book = books[0].volumeInfo;

    logger.debug("Book fetched from Google Books API", { request: { title, authors }, book });

    return {
      google_books_id: books[0].id,
      title: book.title,
      authors: book.authors || [],
      description: book.description || "",
    };
  } catch (err) {
    logger.error("Google Books API error", { error: err.message, title, authors, stack: err.stack });
    throw new Error(`Failed to fetch book from Google Books API: ${err.message}`);
  }
}

module.exports = { fetchBookFromGoogle, findBookInDatabase, saveBookToDatabase };
