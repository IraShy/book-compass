const express = require("express");
const db = require("../../db");
const {
  createReview,
  getReview,
  getAllReviews,
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

router.put("/:id", (req, res) => {
  res.send("Update review");
});

router.delete("/:id", (req, res) => {
  res.send("Delete review");
});

module.exports = router;
