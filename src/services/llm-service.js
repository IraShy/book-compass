const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function getRecommendations(userReviews) {
  const prompt = buildPrompt(userReviews);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text;
}

function buildPrompt(reviews) {
  const reviewText = reviews
    .map((r) => `"${r.title}" (${r.rating}/10): ${r.content}`)
    .join("\n");

  return `Based on these book reviews, suggest 3 books with brief reasons:
${reviewText}

Format as JSON: [{"title": "Book Title", "authors": "Author(s)", "reason": "Why recommended"}]`;
}

function parseAIResponse(rawResponse) {
  // Remove markdown code blocks and parse JSON
  const jsonMatch = rawResponse.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]);
  }
  // Fallback: try parsing directly
  return JSON.parse(rawResponse);
}

module.exports = {
  getRecommendations,
  parseAIResponse,
};
