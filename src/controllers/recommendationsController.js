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
      `SELECT r.rating, r.content, b.title, b.authors
       FROM reviews r
       JOIN books b ON r.book_id = b.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [userId]
    );

    if (reviewsResult.rows.length < 2) {
      req.log.debug("Not enough reviews found for user", { userId });
      return res.status(400).json({
        error: "Need at least 2 reviews to generate recommendations",
      });
    }

    req.log.debug("Generating recommendations based on reviews", {
      userId,
      reviewCount: reviewsResult.rows.length,
    });

    const rawResult = await getRecommendations(reviewsResult.rows);
    const recommendations = parseAIResponse(rawResult);

    if (!recommendations || recommendations.length === 0) {
      req.log.warn("Gemini returned no recommendations.", { rawResult });
      return res.status(404).json({
        message: "No recommendations found. Please try again later.",
      });
    }

    const processedRecommendations = await Promise.all(
      recommendations.map(async (rec) => {
        try {
          const googleBook = await fetchBookFromGoogle(rec.title, rec.authors);
          if (!googleBook) {
            req.log.warn(`Could not find book on Google: ${rec.title}`);
            return null;
          }

          const bookResult = await db.query(
            "SELECT id FROM books WHERE google_books_id = $1",
            [googleBook.google_books_id]
          );

          let bookId;
          if (bookResult.rows.length > 0) {
            bookId = bookResult.rows[0].id;
          } else {
            const insertResult = await db.query(
              `INSERT INTO books (google_books_id, title, authors, description)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (google_books_id) DO NOTHING
               RETURNING id`,
              [
                googleBook.google_books_id,
                googleBook.title,
                googleBook.authors,
                googleBook.description,
              ]
            );
            bookId = insertResult.rows[0]?.id;
          }

          return { ...rec, bookId };
        } catch (error) {
          req.log.warn(`Failed to process book: ${rec.title}`, {
            error: error.message,
          });
          return null;
        }
      })
    );

    const validRecommendations = processedRecommendations.filter(
      (rec) => rec !== null
    );

    if (validRecommendations.length > 0) {
      try {
        const values = [];
        const placeholders = [];

        validRecommendations.forEach((rec, index) => {
          const offset = index * 3;
          placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
          values.push(userId, rec.bookId, rec.reason);
        });

        await db.query(
          `INSERT INTO suggestions (user_id, book_id, reason) VALUES ${placeholders.join(
            ", "
          )}`,
          values
        );
      } catch (insertError) {
        req.log.error("Failed to insert suggestions", {
          error: insertError.message,
        });
        throw insertError;
      }
    }

    res.status(200).json({ recommendations: validRecommendations });
  } catch (error) {
    req.log.error("Recommendation generation failed", { error: error.message });
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
}

module.exports = {
  fetchAllRecommendations,
  generateRecommendations,
};
