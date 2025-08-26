const db = require("../../db");
const { fetchBookFromGoogle } = require("../services/bookService");
const {
  getRecommendations,
  parseAIResponse,
} = require("../services/llm-service");

async function fetchAllRecommendations(req, res) {
  try {
    const userId = req.user.userId;

    const result = await db.query(
      `SELECT s.book_id, s.reason, s.created_at, b.title, b.authors
       FROM suggestions s
       JOIN books b ON s.book_id = b.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );

    req.log.info("Fetched recommendations for user", {
      userId,
      count: result.rows.length,
    });
    res.status(200).json(result.rows);
  } catch (error) {
    req.log.error("Failed to fetch recommendations", { error: error.message });
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
}

async function generateRecommendations(req, res) {
  try {
    const userId = req.user.userId;

    const reviewsResult = await db.query(
      `SELECT r.rating, r.content, b.title 
       FROM reviews r 
       JOIN books b ON r.book_id = b.id 
       WHERE r.user_id = $1 
       ORDER BY r.created_at DESC 
       LIMIT 10`,
      [userId]
    );

    if (reviewsResult.rows.length === 0) {
      req.log.debug("No reviews found for user", { userId });
      return res.status(400).json({
        error: "Need at least 1 review to generate recommendations",
      });
    }

    req.log.debug("Generating recommendations based on reviews", {
      userId,
      reviewCount: reviewsResult.rows.length,
    });

    const rawResult = await getRecommendations(reviewsResult.rows);
    const recommendations = parseAIResponse(rawResult);

    const storedRecommendations = [];

    // Find book for every recommendation and add in the db if doesn't exist; store suggestions
    for (const rec of recommendations) {
      let book = await fetchBookFromGoogle(rec.title, rec.authors);
      if (!book) continue;

      let bookResult = await db.query(
        "SELECT id FROM books WHERE google_books_id = $1",
        [book.google_books_id]
      );

      let bookId;
      if (bookResult.rows.length > 0) {
        bookId = bookResult.rows[0].id;
      } else {
        const insertResult = await db.query(
          `INSERT INTO books (google_books_id, title, authors, description)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [book.google_books_id, book.title, book.authors, book.description]
        );
        bookId = insertResult.rows[0].id;
      }

      // Store suggestion
      await db.query(
        `INSERT INTO suggestions (user_id, book_id, reason) VALUES ($1, $2, $3)`,
        [userId, bookId, rec.reason]
      );

      storedRecommendations.push({ ...rec, bookId });
    }

    res.status(200).json({ recommendations: storedRecommendations });
  } catch (error) {
    req.log.error("Recommendation generation failed", { error: error.message });
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
}

module.exports = {
  fetchAllRecommendations,
  generateRecommendations,
};
