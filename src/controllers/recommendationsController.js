const db = require("../../db");
const { fetchBookFromGoogle } = require("../services/bookService");
const { getRecommendations, parseAIResponse } = require("../services/llm-service");
const { getCachedBook, setCachedBook, getCacheContents } = require("../services/bookCacheService");

const MIN_REVIEWS = 3;
const REVIEWS_FOR_GENERATION = 10;

async function fetchAllRecommendations(req, res) {
  try {
    const userId = req.user.userId;

    const result = await db.query(
      `SELECT s.book_id, s.reason, s.created_at, b.title, b.authors
       FROM suggestions s
       JOIN books b ON s.book_id = b.google_books_id
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
    const startTime = Date.now();
    const userId = req.user.userId;

    const reviewsResult = await db.query(
      `SELECT r.rating, r.content, b.title, b.authors
       FROM reviews r
       JOIN books b ON r.book_id = b.google_books_id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT ${REVIEWS_FOR_GENERATION}`,
      [userId]
    );

    if (reviewsResult.rows.length < MIN_REVIEWS) {
      req.log.debug("Not enough reviews found for user", { userId });
      return res.status(400).json({
        error: `Need at least ${MIN_REVIEWS} reviews to generate recommendations`,
      });
    }

    req.log.debug("Generating recommendations based on reviews", {
      userId,
      reviewCount: reviewsResult.rows.length,
    });

    // LLM call
    const llmStart = Date.now();
    const rawResult = await getRecommendations(reviewsResult.rows);
    const recommendations = parseAIResponse(rawResult);
    const llmTime = Date.now() - llmStart;
    req.log.info(`LLM call took: ${llmTime}ms`);

    if (!recommendations || recommendations.length === 0) {
      req.log.warn("Gemini returned no recommendations.", { rawResult });
      return res.status(404).json({
        message: "No recommendations found. Please try again later.",
      });
    }

    // Book processing
    const bookStart = Date.now();
    const processedRecommendations = await Promise.all(
      recommendations.map(async (rec) => {
        const bookStartTime = Date.now();
        try {
          let recommendedBook = getCachedBook(rec.title, rec.authors);

          if (recommendedBook) {
            req.log.info(`Cache hit for "${rec.title}"`);
            req.log.info(`Processing "${rec.title}" took: ${Date.now() - bookStartTime}ms`);
            req.log.debug("Cache:", getCacheContents());
            return { ...rec, bookId: recommendedBook.google_books_id };
          } else {
            const dbResult = await db.query(
              `SELECT google_books_id, title, authors, description 
               FROM books 
               WHERE title = $1 AND authors @> $2`,
              [rec.title, Array.isArray(rec.authors) ? rec.authors : rec.authors.split(", ")]
            );

            if (dbResult.rows.length > 0) {
              recommendedBook = dbResult.rows[0];
              setCachedBook(rec.title, rec.authors, recommendedBook);
              req.log.info(`DB hit for "${rec.title}"`);
              req.log.info(`Processing "${rec.title}" took: ${Date.now() - bookStartTime}ms`);
              return { ...rec, bookId: recommendedBook.google_books_id };
            } else {
              const apiStart = Date.now();
              recommendedBook = await fetchBookFromGoogle(rec.title, rec.authors);
              const apiTime = Date.now() - apiStart;
              req.log.info(`Google Books API call for "${rec.title}" took: ${apiTime}ms`);

              if (recommendedBook) {
                setCachedBook(rec.title, rec.authors, recommendedBook);

                await db.query(
                  `INSERT INTO books (google_books_id, title, authors, description)
                   VALUES ($1, $2, $3, $4)
                   ON CONFLICT (google_books_id) DO NOTHING`,
                  [
                    recommendedBook.google_books_id,
                    recommendedBook.title,
                    recommendedBook.authors,
                    recommendedBook.description,
                  ]
                );
                req.log.info(`Processing "${rec.title}" took: ${Date.now() - bookStartTime}ms`);
                return { ...rec, bookId: recommendedBook.google_books_id };
              }

              if (!recommendedBook) {
                req.log.warn(`Could not find book on Google: ${rec.title}`);
                return null;
              }
            }
          }
        } catch (error) {
          req.log.warn(`Failed to process book: ${rec.title}`, {
            error: error.message,
          });
          return null;
        }
      })
    );

    const bookTime = Date.now() - bookStart;
    req.log.info(`All book processing took: ${bookTime}ms`);

    const validRecommendations = processedRecommendations.filter((rec) => rec !== null);

    if (validRecommendations.length > 0) {
      try {
        const values = [];
        const placeholders = [];

        validRecommendations.forEach((rec, index) => {
          const offset = index * 3;
          placeholders.push(`($${offset + 1}, $${offset + 2}, $${offset + 3})`);
          values.push(userId, rec.google_books_id, rec.reason);
        });

        await db.query(
          `INSERT INTO suggestions (user_id, book_id, reason) 
           VALUES ${placeholders.join(", ")}
           ON CONFLICT (user_id, book_id) DO NOTHING`,
          values
        );
      } catch (insertError) {
        req.log.error("Failed to insert suggestions", {
          error: insertError.message,
          stack: insertError.stack,
        });
        throw insertError;
      }
    }

    const totalTime = Date.now() - startTime;
    req.log.info(`Total recommendation generation took: ${totalTime}ms`);

    res.status(200).json({ recommendations: validRecommendations });
  } catch (error) {
    req.log.error("Recommendation generation failed", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message || "Failed to generate recommendations" });
  }
}

module.exports = {
  fetchAllRecommendations,
  generateRecommendations,
};
