const bcrypt = require("bcrypt");
const db = require("../../db");
const { generateToken } = require("../services/authService");
const { NotFoundError } = require("../utils/errors");
const { validateEmailUtil, validatePasswordUtil } = require("../utils/validation");
const { findUserById } = require("../services/userService");

require("dotenv").config();

// Register
async function registerUser(req, res) {
  try {
    const { email, password, username: rawUsername } = req.body;

    const username = rawUsername?.trim() || email.split("@")[0];
    const normalizedEmail = email.toLowerCase();
    const hashed = await bcrypt.hash(password, 10);

    const result = await db.query(
      "INSERT INTO users (email, username, hashed_password) VALUES ($1, $2, $3) RETURNING id, email, username, created_at",
      [normalizedEmail, username, hashed]
    );

    const userId = result.rows[0].id;

    generateToken(res, userId);

    req.log.info("User registered successfully", {
      userId: userId,
      email: normalizedEmail,
      username,
    });

    res.status(201).json({ user: result.rows[0] });
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

    const result = await db.query("SELECT * FROM users WHERE email = $1", [normalizedEmail]);

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

    req.log.info("User logged in successfully", {
      userId: user.id,
      email: user.email,
    });

    generateToken(res, user.id);

    const { hashed_password: _, ...userWithoutPassword } = user;

    res.status(200).json({ user: userWithoutPassword });
  } catch (err) {
    req.log.error("User login failed", {
      error: err.message,
      email: req.body.email?.toLowerCase(),
      stack: err.stack,
    });
    res.status(500).json({ error: "Login failed" });
  }
}

async function logoutUser(req, res) {
  try {
    res.clearCookie("authToken");
    req.log.info("User logged out successfully", { userId: req.user?.userId });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    req.log.warn("Logout failed", {
      error: err.message,
      userId: req.user?.userId,
      stack: err.stack,
    });
    res.status(500).json({ error: "Logout failed" });
  }
}

async function viewUserProfile(req, res) {
  try {
    const userId = req.user.userId;
    req.log.debug(`userID: ${userId}`);

    if (!userId) {
      req.log.warn("Profile access attempt without authentication");
      return res.status(401).json({ error: "Authentication required" });
    }

    const { username, email, created_at } = await findUserById(userId);
    req.log.debug("User profile accessed", { userId });

    res.status(200).json({ user: { userId, username, email, created_at } });
  } catch (err) {
    if (err instanceof NotFoundError) {
      req.log.warn("User not found during profile update", { userId: req.user?.userId });
      return res.status(err.statusCode).json({ error: err.message });
    }

    req.log.error("User profile access failed", {
      error: err.message,
      userId: req.user?.userId,
    });
    res.status(500).json({ error: "Internal server error" });
  }
}

async function updateUserProfile(req, res) {
  try {
    const { userId } = req.user;

    if (!userId) {
      req.log.warn("Profile update attempt without authentication");
      return res.status(401).json({ error: "Authentication required" });
    }

    const { username: rawUsername, email, password } = req.body;

    req.log.debug(`Profile update request for userID: ${userId}`, {
      rawUsername,
      email,
    });

    const user = await findUserById(userId);
    let normalizedEmail = user.email;

    req.log.debug("Found user in the database for profile update", { user });

    // Email update
    if (email && email != user.email) {
      const emailError = validateEmailUtil(email);
      if (emailError) {
        return res.status(400).json({ error: emailError });
      }
      // Verify password
      if (!password) {
        return res.status(401).json({ error: "Password is required to change email" });
      }
      const match = await bcrypt.compare(password, user.hashed_password);
      if (!match) {
        req.log.warn("Profile update attempt with incorrect password", {
          userId,
          email: user.email,
        });
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.log.info("Password verified for profile update", { userId });

      // Check if email exists for another user
      normalizedEmail = email.toLowerCase();
      const emailOwner = await db.query("SELECT id FROM users WHERE email = $1 AND id != $2", [
        normalizedEmail,
        userId,
      ]);

      if (emailOwner.rows.length > 0) {
        req.log.warn("Profile update attempt with email already in use", {
          userId,
          email: normalizedEmail,
        });
        return res.status(403).json({ error: "Unable to update email" });
      }

      req.log.debug("Email verified as unique for profile update", { userId, email: normalizedEmail });
    }

    // Update user in the db
    const username = rawUsername?.trim() || user.username;
    const updated_at = new Date();

    const updated = await db.query(
      "UPDATE users SET username = $1, email = $2, updated_at = $3 WHERE id = $4 RETURNING username, email, created_at, updated_at",
      [username, normalizedEmail, updated_at, userId]
    );

    req.log.info("User profile updated successfully", { userId });
    res.status(200).json({ user: { userId, ...updated.rows[0] } });
  } catch (err) {
    if (err instanceof NotFoundError) {
      req.log.warn("User not found during profile update", { userId: req.user?.userId });
      return res.status(err.statusCode).json({ error: err.message });
    }

    req.log.error("User profile update failed", {
      error: err.message,
      stack: err.stack,
      userId: req.user?.userId,
    });
    res.status(500).json({ error: "Internal server error" });
  }
}

async function changePassword(req, res) {
  try {
    const { userId } = req.user;

    if (!userId) {
      req.log.warn("Password change attempt without authentication");
      return res.status(401).json({ error: "Authentication required" });
    }

    const { currentPassword, newPassword } = req.body;

    req.log.debug(`Password change request for userID: ${userId}`);

    if (!currentPassword || !newPassword) {
      req.log.warn("Password change attempt with missing fields", { userId });
      return res.status(400).json({ error: "Current and new passwords are required" });
    }

    const passwordError = validatePasswordUtil(newPassword);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }

    const user = await findUserById(userId);

    // Verify current password
    const match = await bcrypt.compare(currentPassword, user.hashed_password);
    if (!match) {
      req.log.warn("Password change attempt with incorrect current password", {
        userId,
        email: user.email,
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const samePassword = await bcrypt.compare(newPassword, user.hashed_password);
    if (samePassword) {
      return res.status(400).json({ error: "New password must be different from current password" });
    }

    req.log.info("Current password verified for password change", { userId });

    const hashed = await bcrypt.hash(newPassword, 10);
    const updated_at = new Date();

    await db.query("UPDATE users SET hashed_password = $1, updated_at = $2 WHERE id = $3", [
      hashed,
      updated_at,
      userId,
    ]);

    req.log.info("User password changed successfully", { userId });
    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    if (err instanceof NotFoundError) {
      req.log.warn("User not found during profile update", { userId: req.user?.userId });
      return res.status(err.statusCode).json({ error: err.message });
    }

    req.log.error("User password change failed", {
      error: err.message,
      stack: err.stack,
      userId: req.user?.userId,
    });
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  viewUserProfile,
  updateUserProfile,
  changePassword,
};
