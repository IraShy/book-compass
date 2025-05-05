const request = require("supertest");
const app = require("../src/app");
const db = require("../db");

afterAll(async () => {
  await db.query("DELETE FROM users WHERE email LIKE 'testuser%@example.com';");
  //   server.close();
});

describe("User routes", () => {
  let token;

  test("POST /register", async () => {
    const res = await request(app).post("/api/users/register").send({
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

  test("POST /login", async () => {
    const res = await request(app).post("/api/users/login").send({
      email: "testuser1@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");

    token = res.body.token;
  });

  test("GET /profile", async () => {
    const res = await request(app)
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("username", "testuser1");
  });
});
