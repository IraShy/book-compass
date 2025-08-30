const validator = require("validator");
const db = require("../../db");

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
  if (!bookId || typeof bookId !== "string" || bookId.trim() === "") {
    return "Valid book ID is required";
  }
  return null;
};

const validateBookExistsUtil = async (bookId) => {
  const res = await db.query("SELECT * FROM books WHERE google_books_id = $1", [
    bookId,
  ]);
  if (res.rows.length === 0) {
    return "Book not found";
  }
  return null;
};

const validateRatingUtil = (rating) => {
  if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 10) {
    return "Rating must be an integer between 1 and 10";
  }
  return null;
};

const validateContentUtil = (content) => {
  if (content && typeof content === "string" && content.length > 2000) {
    return "Review content too long (max 2000 characters)";
  }
  return null;
};

const sanitiseContent = (content) => {
  if (!content || typeof content !== "string") return null;

  const trimmed = content.trim();
  return trimmed === "" ? null : trimmed;
};

module.exports = {
  validateEmailUtil,
  validatePasswordUtil,
  validateBookIdUtil,
  validateRatingUtil,
  validateBookExistsUtil,
  validateContentUtil,
  sanitiseContent,
};
