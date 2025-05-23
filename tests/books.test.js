const request = require("supertest");
const app = require("../src/app");
const db = require("../db");

const baseUrl = "/api/books";

afterAll(async () => {
  await db.end();
});

describe("Books routes", () => {
  describe("GET /books/find", () => {
    afterEach(async () => {
      await db.query("DELETE FROM books");
    });

    it("returns a book from Google Books if not in db", async () => {
      const res = await request(app).get(
        `${baseUrl}/find?title=The%20Dressmaker&author=Rosalie%20Ham`
      );
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("source", "google_api");
      expect(res.body.book).toHaveProperty("google_books_id");
    });

    it("returns a book from the db if exists", async () => {
      const apiRes = await request(app).get(
        `${baseUrl}/find?title=The%20Dressmaker&author=Rosalie%20Ham`
      );
      const resId = apiRes.body.book.google_books_id;
      const dbRes = await request(app).get(
        `${baseUrl}/find?title=The%20Dressmaker&author=Rosalie%20Ham`
      );
      expect(dbRes.statusCode).toBe(200);
      expect(dbRes.body).toHaveProperty("source", "database");
      expect(dbRes.body.book).toHaveProperty("google_books_id");
      expect(dbRes.body.book.google_books_id).toEqual(resId);
    });

    it("returns a book from Google Books searching by title only", async () => {
      const res = await request(app).get(
        `${baseUrl}/find?title=The%20Dressmaker`
      );
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("source", "google_api");
      expect(res.body.book).toHaveProperty("google_books_id");
    });

    it("returns a book from db searching by title only", async () => {
      const apiRes = await request(app).get(
        `${baseUrl}/find?title=The%20Dressmaker`
      );
      const resId = apiRes.body.book.google_books_id;
      const dbRes = await request(app).get(
        `${baseUrl}/find?title=The%20Dressmaker`
      );
      expect(dbRes.statusCode).toBe(200);
      expect(dbRes.body).toHaveProperty("source", "database");
      expect(dbRes.body.book).toHaveProperty("google_books_id");
      expect(dbRes.body.book.google_books_id).toEqual(resId);
    });

    it("returns 404 if a book not found", async () => {
      const res = await request(app).get(
        `${baseUrl}/find?title=ThisBookDoesntExist12121212`
      );
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty("error", "Book not found");
    });

    it("returns 400 if title is missing", async () => {
      const res = await request(app).get(`${baseUrl}/find`).send();
      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({ error: "Title is required" });
    });
  });
});
