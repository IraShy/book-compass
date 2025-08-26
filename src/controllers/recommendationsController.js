const db = require("../../db");
const {
  getRecommendations,
  parseAIResponse,
} = require("../services/llm-service");

async function fetchAllRecommendations(req, res) {
  try {
    const userId = req.user.userId;

    const result = await db.query(
      `SELECT s.book_id, s.reason, s.created_at, b.title, b.authors
       FROM suggestions s
       JOIN books b ON s.book_id = b.id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );

    req.log.info("Fetched recommendations for user", {
      userId,
      count: result.rows.length,
    });
    res.status(200).json(result.rows);
  } catch (error) {
    req.log.error("Failed to fetch recommendations", { error: error.message });
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
}

async function generateRecommendations(req, res) {
  try {
    const userId = req.user.userId;

    const reviewsResult = await db.query(
      `SELECT r.rating, r.content, b.title 
       FROM reviews r 
       JOIN books b ON r.book_id = b.id 
       WHERE r.user_id = $1 
       ORDER BY r.created_at DESC 
       LIMIT 10`,
      [userId]
    );

    if (reviewsResult.rows.length === 0) {
      return res.status(400).json({
        error: "Need at least 1 review to generate recommendations",
      });
    }

    const rawResult = await getRecommendations(reviewsResult.rows);
    const recommendations = parseAIResponse(rawResult);

    res.json({ recommendations });
  } catch (error) {
    req.log.error("Recommendation generation failed", { error: error.message });
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
}

module.exports = {
  fetchAllRecommendations,
  generateRecommendations,
};
