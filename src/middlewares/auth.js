const jwt = require("jsonwebtoken");

/**
 * Middleware to authenticate JWT token
 */
function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({ error: "Token expired" });
        }
        return res.status(403).json({ error: "Invalid token" });
      }

      req.user = user;
      next();
    });
  } catch (err) {
    console.error("Authentication error:", err);
    return res.status(500).json({ error: "Authentication failed" });
  }
}

/**
 * Middleware to check if email and password are present
 */
const checkCredentialsPresence = (req, res, next) => {
  if (!req.body.email) {
    return res.status(400).json({ error: "Email is required" });
  }

  if (!req.body.password) {
    return res.status(400).json({ error: "Password is required" });
  }

  next();
};

module.exports = { authenticateToken, checkCredentialsPresence };
