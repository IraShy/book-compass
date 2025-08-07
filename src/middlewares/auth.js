const jwt = require("jsonwebtoken");

/**
 * Middleware to authenticate JWT token
 */
function authenticateToken(req, res, next) {
  try {
    req.log.debug(`All cookies: ${JSON.stringify(req.cookies)}`);

    const token = req.cookies.authToken;

    req.log.debug(`auth > authenticateToken > token: ${token}`);

    if (!token) {
      req.log.debug("No token provided");
      return res.status(401).json({ error: "Authentication required" });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          req.log.warn("Token expired");
          return res.status(401).json({ error: "Token expired" });
        }
        req.log.warn("Invalid token");
        return res.status(403).json({ error: "Invalid token" });
      }

      req.user = user;
      next();
    });
  } catch (err) {
    req.log.error("Authentication error", {
      error: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ error: "Authentication failed" });
  }
}

/**
 * Middleware to check if email and password are present
 */
const checkCredentialsPresence = (req, res, next) => {
  if (!req.body.email) {
    req.log.warn("Email not provided", { email: req.body.email });

    return res.status(400).json({ error: "Email is required" });
  }

  if (!req.body.password) {
    req.log.warn("Password not provided", { email: req.body.email });
    return res.status(400).json({ error: "Password is required" });
  }

  next();
};

module.exports = { authenticateToken, checkCredentialsPresence };
