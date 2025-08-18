const db = require("../../db");
const {
  validateBookIdUtil,
  validateRatingUtil,
} = require("../utils/validation");

const validateBookId = (req, res, next) => {
  const error = validateBookIdUtil(req.body.bookId);
  if (error) {
    req.logger.warn("Invalid book ID", {
      bookId: req.body.bookId,
      error,
    });
    return res.status(400).json({ error });
  }
  next();
};

const validateRating = (req, res, next) => {
  const error = validateRatingUtil(req.body.rating);
  if (error) {
    req.logger.warn("Invalid rating", {
      rating: req.body.rating,
      error,
    });
    return res.status(400).json({ error });
  }
  next();
};

const checkDuplicateReview = async (req, res, next) => {
  const userId = req.user?.userId;
  const bookId = req.body.bookId;

  const existingReview = await db.query(
    "SELECT * FROM reviews WHERE user_id = $1 AND book_id = $2",
    [userId, bookId]
  );

  if (existingReview.rows.length > 0) {
    req.log.warn("Duplicate review attempt", {
      userId,
      bookId,
      reviewId: existingReview.rows[0].id,
    });
    return res
      .status(409)
      .json({ error: "You have already reviewed this book" });
  }
  next();
};

module.exports = {
  validateBookId,
  validateRating,
  checkDuplicateReview,
};
