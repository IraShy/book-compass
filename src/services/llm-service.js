const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function getRecommendations(userReviews) {
  const prompt = buildPrompt(userReviews);

  const response = await ai.models.generateContent({
    model: "gemini-1.5-flash",
    contents: prompt,
  });

  return response.text;
}

function buildPrompt(reviews) {
  const reviewText = reviews
    .map((r) => `"${r.title}" by ${r.authors.join(", ")} (${r.rating}/10): ${r.content}`)
    .join("\n");

  return `You are a book recommendation expert. Based on the provided reviews, suggest 3 different books that I would enjoy. The suggestions must be NEW and should NOT include any of the books mentioned below.

  ---

  REVIEWS:
  ${reviewText}

  ---

  Respond with JSON only. No other text. No markdown formatting.

  Example JSON output:
  [
    {
      "title": "A New Title",
      "authors": "Author 1, Author 2",
      "reason": "This book shares similar themes and writing style to the books you enjoy."
    }
  ]`;
}

function parseAIResponse(rawResponse) {
  // Remove markdown code blocks and parse JSON
  const jsonMatch = rawResponse.match(/```json\n([\s\S]*?)\n```/);
  if (jsonMatch && jsonMatch[1]) {
    return JSON.parse(jsonMatch[1]);
  }
  // Fallback: try parsing directly
  return JSON.parse(rawResponse);
}

module.exports = {
  getRecommendations,
  parseAIResponse,
};
