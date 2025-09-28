const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { UnauthorizedError } = require("../utils/errors");

/**
 * Generate JWT token and set it as HTTP-only cookie
 */
function generateToken(res, userId) {
  const token = jwt.sign({ userId: userId }, process.env.JWT_SECRET, {
    expiresIn: "24h",
  });

  res.cookie("authToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
}

async function verifyPassword(plainPassword, hashedPassword) {
  const match = await bcrypt.compare(plainPassword, hashedPassword);
  if (!match) {
    throw new UnauthorizedError("Invalid credentials");
  }
}

module.exports = { generateToken, verifyPassword };
