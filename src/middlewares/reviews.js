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

module.exports = {
  validateBookId,
  validateRating,
};
