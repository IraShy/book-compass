const request = require("supertest");
const app = require("../../src/app");
const db = require("../../db");
const bcrypt = require("bcrypt");

const baseUrl = "/api/reviews";

describe("Reviews routes", () => {
  let testUserId, testBookId, cookies;

  beforeAll(async () => {
    await db.query("BEGIN");

    const hashedPassword = await bcrypt.hash("password123", 10);
    const testUser = await db.query(
      "INSERT INTO users (email, username, hashed_password) VALUES ($1, $2, $3) RETURNING id",
      ["test@example.com", "testuser", hashedPassword]
    );
    testUserId = testUser.rows[0].id;

    const loginRes = await request(app)
      .post("/api/users/login")
      .send({ email: "test@example.com", password: "password123" });
    cookies = loginRes.headers["set-cookie"];

    const testBook = await db.query(
      "INSERT INTO books (title, authors, description) VALUES ($1, $2, $3) RETURNING id",
      ["Test Book", ["Test Author"], "A test book"]
    );
    testBookId = testBook.rows[0].id;
  });

  afterAll(async () => {
    await db.query("ROLLBACK");
    await db.end();
  });

  describe("POST /reviews", () => {
    it("should create a new review", async () => {
      const reviewData = {
        bookId: testBookId,
        rating: 5,
        content: "Great book!",
      };

      const res = await request(app)
        .post(baseUrl)
        .set("Cookie", cookies)
        .send(reviewData)
        .expect(201);

      expect(res.body.review).toHaveProperty("id");
      expect(res.body.review.rating).toBe(reviewData.rating);
      expect(res.body.review.content).toBe(reviewData.content);
    });
  });
});
