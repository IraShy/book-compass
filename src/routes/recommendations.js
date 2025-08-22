const express = require("express");
const db = require("../../db");

const { authenticateToken } = require("../middlewares/auth");
const {
  generateRecommendations,
} = require("../controllers/recommendationsController");
const router = express.Router();

router.post("/generate", authenticateToken, generateRecommendations);

module.exports = router;
