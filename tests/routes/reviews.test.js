const request = require("supertest");
const app = require("../../src/app");
const db = require("../../db");
const bcrypt = require("bcrypt");

const baseUrl = "/api/reviews";

let testUserId, testBookId, cookies, otherUserId;

const postReview = (data) => request(app).post(baseUrl).set("Cookie", cookies).send(data);

const fetchReview = () => request(app).get(`${baseUrl}/${testBookId}`).set("Cookie", cookies);

describe("Reviews routes", () => {
  beforeAll(async () => {
    await db.query("BEGIN");

    const hashedPassword = await bcrypt.hash("password123", 10);

    const testUser = await db.query(
      "INSERT INTO users (email, username, hashed_password) VALUES ($1, $2, $3) RETURNING id",
      ["test@example.com", "testuser", hashedPassword]
    );
    testUserId = testUser.rows[0].id;

    const otherUser = await db.query(
      "INSERT INTO users (email, username, hashed_password) VALUES ($1, $2, $3) RETURNING id",
      ["other@example.com", "otheruser", hashedPassword]
    );
    otherUserId = otherUser.rows[0].id;

    const loginRes = await request(app)
      .post("/api/users/login")
      .send({ email: "test@example.com", password: "password123" });
    cookies = loginRes.headers["set-cookie"];

    const testBook = await db.query(
      "INSERT INTO books (google_books_id, title, authors, description) VALUES ($1, $2, $3, $4) RETURNING google_books_id",
      ["testBookId", "Test Book", ["Test Author"], "A test book"]
    );
    testBookId = testBook.rows[0].google_books_id;
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
        bookId: 111,
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
        bookId: "thisIdDoesntExist",
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
      expect(res.body.error).toBe("Rating must be an integer between 1 and 10");
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

    it("should return 400 for content exceeding 2000 characters", async () => {
      const longContent = "a".repeat(2001);
      const reviewData = {
        bookId: testBookId,
        rating: 5,
        content: longContent,
      };

      const res = await postReview(reviewData);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toBe("Review content too long (max 2000 characters)");
    });
  });

  describe("GET /reviews/:bookId", () => {
    it("should fetch the user's review for a book", async () => {
      const reviewData = {
        bookId: testBookId,
        rating: 5,
        content: "Great book!",
      };

      await postReview(reviewData);

      const res = await fetchReview();

      expect(res.statusCode).toBe(200);
      expect(res.body.review).toHaveProperty("id");
      expect(res.body.review.rating).toBe(reviewData.rating);
      expect(res.body.review.content).toBe(reviewData.content);
    });

    it("should return 404 if no review exists for the user", async () => {
      const res = await fetchReview();

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toBe("Review not found");
    });

    it("should return 401 if user is not authenticated", async () => {
      await request(app).post("/api/users/logout");
      const res = await request(app).get(`${baseUrl}/${testBookId}`);

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error).toBe("Authentication required");
    });

    it("should return 404 when book does not exist", async () => {
      const res = await request(app).get(`${baseUrl}/doesntExist`).set("Cookie", cookies);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Book not found");
    });

    it("should not return other users' reviews", async () => {
      await db.query("INSERT INTO reviews (user_id, book_id, rating, content) VALUES ($1, $2, $3, $4)", [
        otherUserId,
        testBookId,
        3,
        "Other user's review",
      ]);

      const res = await fetchReview();

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Review not found");
    });
  });

  describe("GET /reviews", () => {
    const getAllReviews = () => request(app).get(baseUrl).set("Cookie", cookies);

    it("should return all user's reviews with book details", async () => {
      await postReview({ bookId: testBookId, rating: 5, content: "Great!" });

      const secondBook = await db.query(
        "INSERT INTO books (google_books_id, title, authors, description) VALUES ($1, $2, $3, $4) RETURNING google_books_id",
        ["2ndBookId", "Second Book", ["Author"], "Description"]
      );
      await postReview({
        bookId: secondBook.rows[0].google_books_id,
        rating: 3,
        content: "OK book",
      });

      const res = await getAllReviews();

      expect(res.statusCode).toBe(200);
      expect(res.body.reviews).toHaveLength(2);
      expect(res.body.count).toBe(2);

      expect(res.body.reviews[0]).toHaveProperty("title");
      expect(res.body.reviews[0]).toHaveProperty("authors");
      expect(res.body.reviews[0]).toHaveProperty("rating");
      expect(res.body.reviews[0]).toHaveProperty("content");

      expect(res.body.reviews[1]).toHaveProperty("title");
      expect(res.body.reviews[1]).toHaveProperty("authors");
      expect(res.body.reviews[1]).toHaveProperty("rating");
      expect(res.body.reviews[1]).toHaveProperty("content");
    });

    it("should return empty array when user has no reviews", async () => {
      const res = await getAllReviews();

      expect(res.statusCode).toBe(200);
      expect(res.body.reviews).toEqual([]);
      expect(res.body.count).toBe(0);
    });

    it("should return 401 when not authenticated", async () => {
      const res = await request(app).get(baseUrl);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe("Authentication required");
    });

    it("should only return current user's reviews", async () => {
      // Create review for current user
      await postReview({ bookId: testBookId, rating: 5, content: "My review" });

      // Create review for another user
      await db.query("INSERT INTO reviews (user_id, book_id, rating, content) VALUES ($1, $2, $3, $4)", [
        otherUserId,
        testBookId,
        3,
        "New user's review",
      ]);

      const res = await getAllReviews();

      expect(res.statusCode).toBe(200);
      expect(res.body.reviews).toHaveLength(1);
      expect(res.body.reviews[0].content).toBe("My review");
      expect(res.body.reviews[0].user_id).toBe(testUserId);
    });
  });

  describe("PUT /reviews/:reviewId", () => {
    let reviewId;

    const updateReview = (data, id = reviewId) =>
      request(app).put(`${baseUrl}/${id}`).set("Cookie", cookies).send(data);

    beforeEach(async () => {
      const review = await postReview({
        bookId: testBookId,
        rating: 5,
        content: "Original review",
      });
      reviewId = review.body.review.id;
    });

    it("should update both rating and content", async () => {
      const res = await updateReview({
        rating: 8,
        content: "Updated content",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.review.rating).toBe(8);
      expect(res.body.review.content).toBe("Updated content");
    });

    it("should sanitise content by trimming whitespace", async () => {
      const res = await updateReview({
        rating: 7,
        content: "  trimmed content  ",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.review.content).toBe("trimmed content");
    });

    it("should convert empty string to null", async () => {
      const res = await updateReview({
        rating: 6,
        content: "",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.review.content).toBe(null);
    });

    it("should return 404 when review doesn't exist", async () => {
      const res = await updateReview({ rating: 8 }, 99999);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Review not found");
    });

    it("should return 401 when not authenticated", async () => {
      const res = await request(app).put(`${baseUrl}/${reviewId}`).send({ rating: 8 });

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe("Authentication required");
    });

    it("should not update other user's review", async () => {
      const otherReview = await db.query(
        "INSERT INTO reviews (user_id, book_id, rating, content) VALUES ($1, $2, $3, $4) RETURNING id",
        [otherUserId, testBookId, 3, "Other user's review"]
      );

      const res = await updateReview({ rating: 9 }, otherReview.rows[0].id);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Review not found");

      const checkOther = await db.query("SELECT * FROM reviews WHERE id = $1", [otherReview.rows[0].id]);
      expect(checkOther.rows[0].rating).toBe(3);
    });
  });

  describe("DELETE /reviews/:reviewId", () => {
    let reviewId;

    const deleteReview = (id = reviewId) => request(app).delete(`${baseUrl}/${id}`).set("Cookie", cookies);

    beforeEach(async () => {
      const review = await postReview({
        bookId: testBookId,
        rating: 5,
        content: "Review to delete",
      });
      reviewId = review.body.review.id;
    });

    it("should delete an existing review", async () => {
      const res = await deleteReview();

      expect(res.statusCode).toBe(204);
      expect(res.body).toEqual({});

      const checkRes = await request(app).get(`${baseUrl}/${testBookId}`).set("Cookie", cookies);

      expect(checkRes.statusCode).toBe(404);
      expect(checkRes.body.error).toBe("Review not found");
    });

    it("should return 404 when review doesn't exist", async () => {
      const res = await deleteReview(99999);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Review not found");
    });

    it("should return 401 when not authenticated", async () => {
      const res = await request(app).delete(`${baseUrl}/${reviewId}`);

      expect(res.statusCode).toBe(401);
      expect(res.body.error).toBe("Authentication required");
    });

    it("should not delete other user's review", async () => {
      const otherReview = await db.query(
        "INSERT INTO reviews (user_id, book_id, rating, content) VALUES ($1, $2, $3, $4) RETURNING id",
        [otherUserId, testBookId, 3, "Other user's review"]
      );

      const res = await deleteReview(otherReview.rows[0].id);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Review not found");

      const checkOther = await db.query("SELECT * FROM reviews WHERE id = $1", [otherReview.rows[0].id]);
      expect(checkOther.rows).toHaveLength(1);
    });
  });
});
