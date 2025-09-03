const request = require("supertest");
const app = require("../../src/app");
const db = require("../../db");
const { validateBookId, validateRating, checkDuplicateReview } = require("../../src/middlewares/reviews");

describe("Review Middlewares", () => {
  let testUserId, testBookId;

  beforeAll(async () => {
    await db.query("BEGIN");
    // Create test user
    const userResult = await db.query(
      "INSERT INTO users (username, email, hashed_password) VALUES ($1, $2, $3) RETURNING id",
      ["testuser", "test@example.com", "hashedpassword"]
    );
    testUserId = userResult.rows[0].id;

    // Create test book
    await db.query(
      "INSERT INTO books (google_books_id, title, authors, description) VALUES ($1, $2, $3, $4)",
      ["test_book_123", "Test Book", ["Test Author"], "Test description"]
    );
    testBookId = "test_book_123";
  });

  afterAll(async () => {
    await db.query("ROLLBACK");
    await db.end();
  });

  afterEach(async () => {
    await db.query("DELETE FROM reviews WHERE user_id = $1", [testUserId]);
  });

  describe("validateBookId middleware", () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        body: {},
        params: {},
        log: { warn: jest.fn() },
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();
    });

    it("should pass validation for valid book ID in body", async () => {
      req.body.bookId = testBookId;

      await validateBookId(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should pass validation for valid book ID in params", async () => {
      req.params.bookId = testBookId;

      await validateBookId(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 400 for missing book ID", async () => {
      await validateBookId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Valid book ID is required",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 for empty string book ID", async () => {
      req.body.bookId = "";

      await validateBookId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Valid book ID is required",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 for non-string book ID", async () => {
      req.body.bookId = 123;

      await validateBookId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Valid book ID is required",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 404 for non-existent book", async () => {
      req.body.bookId = "non_existent_book_id";

      await validateBookId(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Book not found",
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("validateRating middleware", () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        body: {},
        log: { warn: jest.fn() },
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();
    });

    it("should pass validation for valid rating", () => {
      req.body.rating = 5;

      validateRating(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should pass validation for minimum rating", () => {
      req.body.rating = 1;

      validateRating(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should pass validation for maximum rating", () => {
      req.body.rating = 10;

      validateRating(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 400 for rating below minimum", () => {
      req.body.rating = 0;

      validateRating(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Rating must be an integer between 1 and 10",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 for rating above maximum", () => {
      req.body.rating = 11;

      validateRating(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Rating must be an integer between 1 and 10",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 for non-integer rating", () => {
      req.body.rating = 5.5;

      validateRating(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Rating must be an integer between 1 and 10",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 400 for missing rating", () => {
      validateRating(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Rating must be an integer between 1 and 10",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should log warnings for invalid ratings", () => {
      req.body.rating = 15;

      validateRating(req, res, next);

      expect(req.log.warn).toHaveBeenCalledWith("Invalid rating", {
        rating: 15,
        error: "Rating must be an integer between 1 and 10",
      });
    });
  });

  describe("checkDuplicateReview middleware", () => {
    let req, res, next;

    beforeEach(() => {
      req = {
        user: { userId: testUserId },
        body: { bookId: testBookId },
        log: { warn: jest.fn() },
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      next = jest.fn();
    });

    it("should pass when no existing review", async () => {
      await checkDuplicateReview(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 409 when review already exists", async () => {
      // Create existing review
      await db.query("INSERT INTO reviews (user_id, book_id, rating, content) VALUES ($1, $2, $3, $4)", [
        testUserId,
        testBookId,
        5,
        "Existing review",
      ]);

      await checkDuplicateReview(req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "You have already reviewed this book",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("should allow different users to review same book", async () => {
      // Create another user
      const otherUserResult = await db.query(
        "INSERT INTO users (username, email, hashed_password) VALUES ($1, $2, $3) RETURNING id",
        ["otheruser", "other@example.com", "hashedpassword"]
      );
      const otherUserId = otherUserResult.rows[0].id;

      // Create review for other user
      await db.query("INSERT INTO reviews (user_id, book_id, rating, content) VALUES ($1, $2, $3, $4)", [
        otherUserId,
        testBookId,
        5,
        "Other user's review",
      ]);

      // Current user should still be able to review
      await checkDuplicateReview(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();

      await db.query("DELETE FROM reviews WHERE user_id = $1", [otherUserId]);
      await db.query("DELETE FROM users WHERE id = $1", [otherUserId]);
    });

    it("should log warnings for duplicate attempts", async () => {
      // Create existing review
      const reviewResult = await db.query(
        "INSERT INTO reviews (user_id, book_id, rating, content) VALUES ($1, $2, $3, $4) RETURNING id",
        [testUserId, testBookId, 5, "Existing review"]
      );

      await checkDuplicateReview(req, res, next);

      expect(req.log.warn).toHaveBeenCalledWith("Duplicate review attempt", {
        userId: testUserId,
        bookId: testBookId,
        reviewId: reviewResult.rows[0].id,
      });
    });
  });
});
