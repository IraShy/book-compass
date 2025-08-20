const express = require("express");
const db = require("../../db");
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
  checkDuplicateReview,
  createReview
);

router.put("/:id", authenticateToken, validateRating, updateReview);

router.delete("/:id", authenticateToken, deleteReview);

module.exports = router;
