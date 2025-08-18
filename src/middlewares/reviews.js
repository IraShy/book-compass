const db = require("../../db");
const {
  validateBookIdUtil,
  validateRatingUtil,
  validateBookExistsUtil,
} = require("../utils/validation");

const validateBookId = async (req, res, next) => {
  const bookId = req.body?.bookId || req.params.bookId;

  const formatError = validateBookIdUtil(bookId);
  if (formatError) {
    req.log.warn("Invalid book ID", {
      bookId,
      error: formatError,
    });
    return res.status(400).json({ error: formatError });
  }

  const existsError = await validateBookExistsUtil(bookId);
  if (existsError) {
    req.log.warn("Book does not exist", {
      bookId,
      error: existsError,
    });
    return res.status(404).json({ error: existsError });
  }
  next();
};

const validateRating = (req, res, next) => {
  const error = validateRatingUtil(req.body.rating);
  if (error) {
    req.log.warn("Invalid rating", {
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
