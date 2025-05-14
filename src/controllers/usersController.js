const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const db = require("../../db");

require("dotenv").config();

// Register
async function registerUser(req, res) {
  try {
    const { email, password, username: rawUsername } = req.body;

    if (!validator.isEmail(email)) {
      return res.status(401).json({ error: "Invalid email format" });
    }

    const username = rawUsername?.trim() || email.split("@")[0];
    const normalizedEmail = email.toLowerCase();
    const hashed = await bcrypt.hash(password, 10);
    const result = await db.query(
      "INSERT INTO users (email, username, hashed_password) VALUES ($1, $2, $3) RETURNING id, email, username, created_at",
      [normalizedEmail, username, hashed]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.log("users/register error:", err);
    if (err.code === "23505") {
      // Unique violation (duplicate email)
      console.log("user register error: email already registered");
      return res.status(403).json({ error: "Invalid credentials" });
    }
    res.status(500).json({ error: "User registration failed" });
  }
}

// Login
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase(),
    ]);

    const user = result.rows[0];
    if (!user) {
      console.log("user login error: account does not exist");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.hashed_password);
    if (!match) {
      console.log("user login error: incorrect password");
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    const { hashed_password, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    console.error("users/login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
}

async function viewUserProfile(req, res) {
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
}

module.exports = {
  registerUser,
  loginUser,
  viewUserProfile,
};
