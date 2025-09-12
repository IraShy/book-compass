const request = require("supertest");
const app = require("../../src/app");
const db = require("../../db");
const bookCacheService = require("../../src/services/bookCacheService");

const baseUrl = "/api/books";

beforeEach(async () => {
  // Clear both cache and database before each test
  bookCacheService.clearCache();
  await db.query("DELETE FROM books");
});

afterEach(async () => {
  // Clean up after each test
  bookCacheService.clearCache();
  await db.query("DELETE FROM books");
});

afterAll(async () => {
  bookCacheService.clearCache();
  await db.query("ROLLBACK");
  await db.end();
});

describe("Books routes", () => {
  describe("GET /books/find", () => {
    afterEach(async () => {
      await db.query("DELETE FROM books");
    });

    it("returns a book from Google Books if not in db", async () => {
      const res = await request(app).get(`${baseUrl}/find?title=The%20Dressmaker&authors=Rosalie%20Ham`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("source", "google_api");
      expect(res.body.book).toHaveProperty("google_books_id");
    });

    it("returns a book from cache on second request", async () => {
      // First request - from API
      const apiRes = await request(app).get(`${baseUrl}/find?title=The%20Dressmaker&authors=Rosalie%20Ham`);
      expect(apiRes.statusCode).toBe(200);
      expect(apiRes.body.source).toBe("google_api");

      // Second request - from cache
      const cacheRes = await request(app).get(`${baseUrl}/find?title=The%20Dressmaker&authors=Rosalie%20Ham`);
      expect(cacheRes.statusCode).toBe(200);
      expect(cacheRes.body.source).toBe("cache");
      expect(cacheRes.body.book.google_books_id).toEqual(apiRes.body.book.google_books_id);
    });

    it("returns a book from database when cache is cleared", async () => {
      // First request - from API
      const apiRes = await request(app).get(`${baseUrl}/find?title=The%20Dressmaker&authors=Rosalie%20Ham`);
      const resId = apiRes.body.book.google_books_id;

      // Clear cache manually
      bookCacheService.clearCache();

      // Second request - should come from database
      const dbRes = await request(app).get(`${baseUrl}/find?title=The%20Dressmaker&authors=Rosalie%20Ham`);
      expect(dbRes.statusCode).toBe(200);
      expect(dbRes.body.source).toBe("database");
      expect(dbRes.body.book.google_books_id).toEqual(resId);
    });

    it("returns 404 if a book not found", async () => {
      const res = await request(app).get(
        `${baseUrl}/find?title=ThisBookDoesntExist12121212&authors=NoAuthor`
      );
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty("error", "Book not found");
    });

    it("returns 400 if title is missing", async () => {
      const res = await request(app).get(`${baseUrl}/find`).send();
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({ error: "Title is required" });
    });

    it("returns 400 if authors is missing", async () => {
      const res = await request(app).get(`${baseUrl}/find?title=SomeTitle`);
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({ error: "At least one author is required" });
    });

    it("handles multiple authors in search", async () => {
      const res = await request(app).get(
        `${baseUrl}/find?title=Good%20Omens&authors=Terry%20Pratchett%2C%20Neil%20Gaiman`
      );
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("source", "google_api");
      expect(res.body.book).toHaveProperty("google_books_id");
    });

    it("finds book with partial author match", async () => {
      const firstRes = await request(app).get(
        `${baseUrl}/find?title=The%20Master%20and%20Margarita&authors=Mikhail%20Bulgakov`
      );
      expect(firstRes.statusCode).toBe(200);

      bookCacheService.clearCache();

      const res = await request(app).get(`${baseUrl}/find?title=Master%20and%20Margarita&authors=Bulgakov`);

      expect(res.statusCode).toBe(200);
      expect(["database", "google_api"]).toContain(res.body.source);
      expect(res.body.book.google_books_id).toBe(firstRes.body.book.google_books_id);
    });
  });
});
