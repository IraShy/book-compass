const request = require("supertest");
const app = require("../../src/app");
const db = require("../../db");
const bcrypt = require("bcrypt");

const baseUrl = "/api/reviews";

let testUserId, testBookId, cookies;

const postReview = (data) =>
  request(app).post(baseUrl).set("Cookie", cookies).send(data);

describe("Reviews routes", () => {
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

  beforeEach(async () => {
    await db.query("DELETE from reviews");
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

      const res = await postReview(reviewData);

      expect(res.statusCode).toBe(201);
      expect(res.body.review).toHaveProperty("id");
      expect(res.body.review.rating).toBe(reviewData.rating);
      expect(res.body.review.content).toBe(reviewData.content);
    });

    test("new review belongs to the user", async () => {
      const reviewData = {
        bookId: testBookId,
        rating: 4,
        content: "Interesting read",
      };

      const res = await postReview(reviewData);

      expect(res.statusCode).toBe(201);
      expect(res.body.review.user_id).toBe(testUserId);
      expect(res.body.review.book_id).toBe(testBookId);
    });

    it("should create a review when content is empty", async () => {
      const reviewData = {
        bookId: testBookId,
        rating: 5,
        content: "",
      };

      const res = await postReview(reviewData);

      expect(res.statusCode).toBe(201);
      expect(res.body.review.content).toBe(null);
    });

    it("should return 401 if user is not authenticated", async () => {
      const reviewData = {
        bookId: testBookId,
        rating: 5,
        content: "Great book!",
      };

      await request(app).post("/api/users/logout");
      const res = await request(app).post(baseUrl).send(reviewData);

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toBe("Authentication required");
    });

    it("should return 400 for invalid book ID", async () => {
      const reviewData = {
        bookId: "1qw23",
        rating: 5,
        content: "Great book!",
      };

      const res = await postReview(reviewData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toBe("Valid book ID is required");
    });

    it("should return 404 when book doesn't exist", async () => {
      const reviewData = {
        bookId: 99999,
        rating: 5,
        content: "Great book!",
      };

      const res = await postReview(reviewData);

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toBe("Book not found");
    });

    it("should return 400 for invalid rating", async () => {
      const reviewData = {
        bookId: testBookId,
        rating: 11,
        content: "Great book!",
      };

      const res = await postReview(reviewData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toBe("Rating must be between 1 and 10");
    });

    it("should return 409 for duplicate review", async () => {
      const initialReviewData = {
        bookId: testBookId,
        rating: 5,
        content: "Nice.",
      };

      // Create the first review
      await postReview(initialReviewData);

      const secondReviewData = {
        bookId: testBookId,
        rating: 9,
        content: "I like it better now!",
      };

      // Attempt to create the same review again
      const res = await postReview(secondReviewData);

      expect(res.statusCode).toBe(409);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toBe("You have already reviewed this book");
    });
  });
});
