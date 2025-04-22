const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../../db");
const authenticateToken = require("../middlewares/auth");

require("dotenv").config();

const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    const username = req.body.username?.trim() || req.body.email.split("@")[0];

    console.log(email, username, password);
    console.log("Connected to DB:", process.env.DATABASE_URL);

    const hashed = await bcrypt.hash(password, 10);
    const result = await db.query(
      "INSERT INTO users (email, username, hashed_password) VALUES ($1, $2, $3) RETURNING id, email, username, created_at",
      [email.toLowerCase(), username, hashed]
    );
    console.log("result:", result);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("users/register error:", err);
    res.status(500).json({ error: "User registration failed" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await dbpr.query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);

    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.hashed_password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: { id: user.id, email: user.email, username: user.username },
    });
  } catch (err) {
    console.error("users/login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await db.query("SELECT username FROM users WHERE id = $1", [
      userId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const username = result.rows[0].username;
    res.status(200).json({ userId, username });
  } catch (err) {
    console.error("users/profile error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
