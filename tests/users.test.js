const request = require("supertest");
const app = require("../src/app");
const db = require("../db");

const baseUrl = "/api/users";
const registerUser = (data) =>
  request(app).post(`${baseUrl}/register`).send(data);
const loginUser = (data) => request(app).post(`${baseUrl}/login`).send(data);

afterAll(async () => {
  await db.query("DELETE FROM users WHERE email LIKE 'testuser%@example.com';");
});

describe("User routes", () => {
  let token;
  describe("POST /register", () => {
    test("valid data", async () => {
      const res = await registerUser({
        email: "testuser1@example.com",
        username: "testuser1",
        password: "password123",
      });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("email", "testuser1@example.com");
      expect(res.body).toHaveProperty("username", "testuser1");

      const user = await db.query(
        "SELECT * FROM users WHERE email = 'testuser1@example.com'"
      );

      expect(user.rows[0]).toMatchObject({
        username: "testuser1",
        email: "testuser1@example.com",
      });
    });

    test("missing email", async () => {
      const res = await registerUser({
        password: "password123",
      });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error", "Missing credentials");
    });

    test("invalid email format", async () => {
      let res = await registerUser({
        email: "invalidemail.com",
        password: "password123",
      });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error", "Invalid email format");

      res = await registerUser({
        email: "@invalidemail.com",
        password: "password123",
      });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error", "Invalid email format");

      res = await registerUser({
        email: "invalidemail@.com",
        password: "password123",
      });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error", "Invalid email format");
    });

    test("missing password", async () => {
      const res = await registerUser({
        email: "testuser2@example.com",
      });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("error", "Missing credentials");
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
      expect(res.body).toHaveProperty("username", "testuser3");

      const user = await db.query(
        "SELECT * FROM users WHERE email = 'testuser3@example.com'"
      );

      expect(user.rows[0]).toMatchObject({
        username: "testuser3",
        email: "testuser3@example.com",
      });
    });
  });

  describe("POST /login", () => {
    test("valid data", async () => {
      const res = await loginUser({
        email: "testuser1@example.com",
        password: "password123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("token");

      token = res.body.token;
    });

    test("invalid email", async () => {
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

  test("GET /profile", async () => {
    const res = await request(app)
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("username", "testuser1");
  });
});
