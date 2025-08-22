const db = require("../../db");
const {
  getRecommendations,
  parseAIResponse,
} = require("../services/llm-service");

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
  generateRecommendations,
};
