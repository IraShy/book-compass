const db = require("../../db");
const { sanitiseContent } = require("../utils/validation");

async function createReview(req, res) {
  try {
    const userId = req.user?.userId;
    const { bookId, rating, content } = req.body;

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
      [userId, bookId, rating, sanitiseContent(content)]
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

async function getReview(req, res) {
  const userId = req.user.userId;
  const bookId = req.params.bookId;

  try {
    const result = await db.query(
      `SELECT r.*, b.title, b.authors 
       FROM reviews r 
       JOIN books b ON r.book_id = b.id 
       WHERE r.user_id = $1 AND r.book_id = $2`,
      [userId, bookId]
    );

    if (result.rows.length === 0) {
      req.log.warn("Review not found", {
        userId,
        bookId,
      });
      return res.status(404).json({ error: "Review not found" });
    }

    req.log.info("Review fetched successfully", {
      reviewId: result.rows[0].id,
      userId,
      bookId,
    });

    return res.status(200).json({ review: result.rows[0] });
  } catch (err) {
    req.log.error("Error fetching review", {
      error: err.message,
      stack: err.stack,
      userId,
      bookId,
    });
    return res.status(500).json({ error: "Failed to fetch review" });
  }
}

async function getAllReviews(req, res) {
  const userId = req.user.userId;

  try {
    const result = await db.query(
      `SELECT r.*, b.title, b.authors 
       FROM reviews r 
       JOIN books b ON r.book_id = b.id 
       WHERE r.user_id = $1`,
      [userId]
    );

    req.log.info("Reviews fetched successfully", {
      userId,
      reviewCount: result.rows.length,
    });

    return res.status(200).json({
      reviews: result.rows,
      count: result.rows.length,
    });
  } catch (err) {
    req.log.error("Error fetching reviews", {
      error: err.message,
      stack: err.stack,
      userId,
    });
    return res.status(500).json({ error: "Failed to fetch reviews" });
  }
}

async function updateReview(req, res) {
  const userId = req.user.userId;
  const reviewId = req.params.id;
  const { rating, content } = req.body;

  try {
    const result = await db.query(
      `UPDATE reviews 
       SET rating = $1, content = $2, updated_at = NOW() 
       WHERE id = $3 AND user_id = $4 
       RETURNING *`,
      [rating, sanitiseContent(content), reviewId, userId]
    );

    if (result.rows.length === 0) {
      req.log.warn("Review not found for update", { userId, reviewId });
      return res.status(404).json({ error: "Review not found" });
    }

    req.log.info("Review updated successfully", {
      reviewId: result.rows[0].id,
      userId,
      rating,
      contentLength: content?.length || 0,
    });

    return res.status(200).json({ review: result.rows[0] });
  } catch (err) {
    req.log.error("Error updating review", {
      error: err.message,
      stack: err.stack,
      userId,
      reviewId,
    });
    return res.status(500).json({ error: "Failed to update review" });
  }
}

module.exports = {
  createReview,
  getReview,
  getAllReviews,
  updateReview,
};
