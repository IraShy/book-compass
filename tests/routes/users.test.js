const request = require("supertest");
const app = require("../../src/app");
const db = require("../../db");

const baseUrl = "/api/users";
const registerUser = (data) => request(app).post(`${baseUrl}/register`).send(data);
const loginUser = (data) => request(app).post(`${baseUrl}/login`).send(data);

beforeEach(async () => {
  await db.query("DELETE FROM users");
});

afterAll(async () => {
  await db.query("ROLLBACK");
  await db.end();
});

describe("User routes", () => {
  describe("POST /register", () => {
    test("valid data", async () => {
      const res = await registerUser({
        email: "testuser1@example.com",
        username: "test username",
        password: "password123",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.user).toHaveProperty("email", "testuser1@example.com");
      expect(res.body.user).toHaveProperty("username", "test username");
      expect(res.headers["set-cookie"]).toBeDefined();
      expect(res.headers["set-cookie"][0]).toMatch(/authToken=/);

      const user = await db.query("SELECT * FROM users WHERE email = 'testuser1@example.com'");

      expect(user.rows[0]).toMatchObject({
        username: "test username",
        email: "testuser1@example.com",
      });
    });

    test("missing email", async () => {
      const res = await registerUser({
        password: "password123",
      });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error", "Email is required");
    });

    test("invalid email format", async () => {
      const invalidEmails = [
        "invalidemail.com",
        "@invalidemail.com",
        "invalidemail@.com",
        "invalidemail@com",
        "invalid@",
        "invalid@@example.com",
      ];

      for (const email of invalidEmails) {
        const res = await registerUser({ email, password: "password123" });
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty("error", "Invalid email format");
      }
    });

    test("missing password", async () => {
      const res = await registerUser({
        email: "testuser2@example.com",
      });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error", "Password is required");
    });

    test("short password", async () => {
      const res = await registerUser({
        email: "testuser2@example.com",
        password: "short",
      });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error", "Password must be between 8 and 64 characters long");
    });

    test("long password", async () => {
      const res = await registerUser({
        email: "testuser2@example.com",
        password: "a".repeat(65),
      });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error", "Password must be between 8 and 64 characters long");
    });

    test("duplicate email", async () => {
      await registerUser({
        email: "testuser2@example.com",
        username: "testuser2",
        password: "password123",
      });

      const res = await registerUser({
        email: "testuser2@example.com",
        username: "testuser2",
        password: "password123",
      });

      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty("error", "Invalid credentials");
    });

    test("username auto-filled from email", async () => {
      const res = await registerUser({
        email: "testuser3@example.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.user).toHaveProperty("username", "testuser3");

      const user = await db.query("SELECT * FROM users WHERE email = 'testuser3@example.com'");

      expect(user.rows[0]).toMatchObject({
        username: "testuser3",
        email: "testuser3@example.com",
      });
    });
  });

  describe("POST /login", () => {
    test("valid data", async () => {
      await registerUser({
        email: "testuser1@example.com",
        password: "password123",
      });

      const res = await loginUser({
        email: "testuser1@example.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("email", "testuser1@example.com");
      expect(res.headers["set-cookie"]).toBeDefined();
      expect(res.headers["set-cookie"][0]).toMatch(/authToken=/);
    });

    test("invalid email format", async () => {
      const invalidEmails = [
        "invalidemail.com",
        "@invalidemail.com",
        "invalidemail@.com",
        "invalidemail@com",
        "invalid@",
        "invalid@@example.com",
      ];

      for (const email of invalidEmails) {
        const res = await loginUser({ email, password: "password123" });
        expect(res.statusCode).toBe(401);
        expect(res.body).toHaveProperty("error", "Invalid email format");
      }
    });

    test("non-existing email", async () => {
      const res = await loginUser({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error", "Invalid credentials");
    });

    test("incorrect password", async () => {
      const res = await loginUser({
        email: "testuser1@example.com",
        password: "wrongpassword",
      });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error", "Invalid credentials");
    });
  });

  describe("GET /profile", () => {
    test("valid authentication", async () => {
      const registerRes = await registerUser({
        email: "testuser1@example.com",
        password: "password123",
      });

      const cookies = registerRes.headers["set-cookie"];
      const res = await request(app).get("/api/users/profile").set("Cookie", cookies);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("userId");
      expect(res.body).toHaveProperty("username", "testuser1");
    });

    test("no authentication", async () => {
      const res = await request(app).get("/api/users/profile");

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error", "Authentication required");
    });
  });

  describe("POST /logout", () => {
    test("log out from logged-in state", async () => {
      const registerRes = await registerUser({
        email: "testuser1@example.com",
        password: "password123",
      });

      const cookies = registerRes.headers["set-cookie"];
      const res = await request(app).post("/api/users/logout").set("Cookie", cookies);

      expect(res.statusCode).toBe(200);
      expect(res.headers["set-cookie"]).toBeDefined();
      expect(res.headers["set-cookie"][0]).toMatch(/authToken=;/);

      const cookieHeader = res.headers["set-cookie"][0];
      const expiresMatch = cookieHeader.match(/Expires=([^;]+)/);
      expect(expiresMatch).toBeTruthy();

      const expiresDate = new Date(expiresMatch[1]);
      expect(expiresDate.getTime()).toBeLessThan(Date.now());

      expect(res.body).toHaveProperty("message", "Logged out successfully");
    });

    test("logout without authentication", async () => {
      const res = await request(app).post("/api/users/logout");

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error", "Authentication required");
    });
  });
});
