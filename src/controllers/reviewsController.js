const db = require("../../db");

async function createReview(req, res) {
  try {
    const userId = req.user?.userId;
    const { bookId, rating, content } = req.body;

    if (!userId) {
      req.log.warn("Review creation attempt without authentication");
      return res.status(401).json({ error: "Authentication required" });
    }

    req.log.debug("Review creation initiated", {
      userId,
      bookId,
      rating,
      contentLength: content?.length || 0,
    });

    const insertResult = await db.query(
      `INSERT INTO reviews (user_id, book_id, rating, content) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`,
      [userId, bookId, rating, content]
    );

    req.log.info("Review created", {
      reviewId: insertResult.rows[0].id,
      userId,
      bookId,
      rating,
      contentLength: content?.length || 0,
    });

    return res.status(201).json({
      review: insertResult.rows[0],
    });
  } catch (err) {
    req.log.error("Error creating review", {
      error: err.message,
      stack: err.stack,
      userId: req.user?.userId,
      bookId: req.body.bookId,
    });
    return res.status(500).json({ error: "Failed to create review" });
  }
}
module.exports = {
  createReview,
};
