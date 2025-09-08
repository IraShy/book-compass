const express = require("express");
const {
  createReview,
  getReview,
  getAllReviews,
  updateReview,
  deleteReview,
} = require("../controllers/reviewsController");
const { authenticateToken } = require("../middlewares/auth");
const {
  validateBookId,
  validateRating,
  validateContent,
  checkDuplicateReview,
} = require("../middlewares/reviews");

const router = express.Router();

router.get("/", authenticateToken, getAllReviews);

router.get("/:bookId", authenticateToken, validateBookId, getReview);

router.post(
  "/",
  authenticateToken,
  validateBookId,
  validateRating,
  validateContent,
  checkDuplicateReview,
  createReview
);

router.put("/:id", authenticateToken, validateRating, validateContent, updateReview);

router.delete("/:id", authenticateToken, deleteReview);

module.exports = router;
