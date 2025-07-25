const express = require("express");
const db = require("../../db");
const { createReview } = require("../controllers/reviewsController");
const { authenticateToken } = require("../middlewares/auth");

const router = express.Router();

router.get("/", (req, res) => {
  res.send("All reviews");
});

router.get("/:id", (req, res) => {
  res.send("Single review");
});

router.post("/", authenticateToken, createReview);

router.put("/:id", (req, res) => {
  res.send("Update review");
});

router.delete("/:id", (req, res) => {
  res.send("Delete review");
});

module.exports = router;
