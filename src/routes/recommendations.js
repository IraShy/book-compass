const express = require("express");
const db = require("../../db");

const { authenticateToken } = require("../middlewares/auth");
const {
  generateRecommendations,
  fetchAllRecommendations,
} = require("../controllers/recommendationsController");
const router = express.Router();

router.get("/", authenticateToken, fetchAllRecommendations);

router.post("/generate", authenticateToken, generateRecommendations);

module.exports = router;
