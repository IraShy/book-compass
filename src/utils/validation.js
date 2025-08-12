const validator = require("validator");

const validateEmailUtil = (email) => {
  if (!validator.isEmail(email)) {
    return "Invalid email format";
  }

  return null; // Valid
};

const validatePasswordUtil = (password) => {
  if (!validator.isLength(password, { min: 8, max: 64 })) {
    return "Password must be between 8 and 64 characters long";
  }

  return null; // Valid
};

const validateBookIdUtil = (bookId) => {
  if (!bookId || !Number.isInteger(Number(bookId))) {
    return "Valid book ID is required";
  }
  return null;
};

const validateRatingUtil = (rating) => {
  if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 10) {
    return "Rating must be between 1 and 10";
  }
  return null;
};

module.exports = {
  validateEmailUtil,
  validatePasswordUtil,
  validateBookIdUtil,
  validateRatingUtil,
};
