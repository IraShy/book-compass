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
      req.log.warn("Invalid email format attempted", { email });
      return res.status(401).json({ error: "Invalid email format" });
    }

    const username = rawUsername?.trim() || email.split("@")[0];
    const normalizedEmail = email.toLowerCase();
    const hashed = await bcrypt.hash(password, 10);

    const result = await db.query(
      "INSERT INTO users (email, username, hashed_password) VALUES ($1, $2, $3) RETURNING id, email, username, created_at",
      [normalizedEmail, username, hashed]
    );

    req.log.info("User registered successfully", {
      userId: result.rows[0].id,
      email: normalizedEmail,
      username,
    });

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      // Unique violation (duplicate email)
      req.log.warn("Registration attempt with existing email", {
        email: req.body.email?.toLowerCase(),
      });
      return res.status(403).json({ error: "Invalid credentials" });
    }

    req.log.error("User registration failed", {
      error: err.message,
      email: req.body.email?.toLowerCase(),
    });

    res.status(500).json({ error: "User registration failed" });
  }
}

// Login
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      normalizedEmail,
    ]);

    const user = result.rows[0];
    if (!user) {
      req.log.warn("Login attempt with non-existent email", {
        email: normalizedEmail,
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.hashed_password);
    if (!match) {
      req.log.warn("Login attempt with incorrect password", {
        userId: user.id,
        email: normalizedEmail,
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    req.log.info("User logged in successfully", {
      userId: user.id,
      email: normalizedEmail,
    });

    const { hashed_password, ...userWithoutPassword } = user;

    res.json({
      token,
      user: userWithoutPassword,
    });
  } catch (err) {
    req.log.error("User login failed", {
      error: err.message,
      email: req.body.email?.toLowerCase(),
      stack: err.stack,
    });
    res.status(500).json({ error: "Login failed" });
  }
}

async function viewUserProfile(req, res) {
  try {
    const userId = req.user.userId;

    if (!userId) {
      req.log.warn("Profile access attempt without authentication");
      return res.status(401).json({ error: "Authentication required" });
    }

    const result = await db.query("SELECT username FROM users WHERE id = $1", [
      userId,
    ]);

    if (result.rows.length === 0) {
      req.log.warn("Profile access attempt for non-existent user", { userId });
      return res.status(404).json({ error: "User not found" });
    }

    const username = result.rows[0].username;
    req.log.debug("User profile accessed", { userId });

    res.status(200).json({ userId, username });
  } catch (err) {
    req.log.error("User profile access failed", {
      error: err.message,
      userId: req.user?.userId,
    });
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  registerUser,
  loginUser,
  viewUserProfile,
};
