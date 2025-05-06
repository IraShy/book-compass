const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Token required" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error("authenticateToken middleware error:", err);
      return res.status(403).json({ error: "Invalid token" });
    }

    req.user = user;
    next();
  });
}

const checkCredentialsPresence = (req, res, next) => {
  if (!req.body.password || !req.body.email) {
    console.error("checkCredentialsPresence middleware error");
    return res.status(401).json({ error: "Missing credentials" });
  }
  next();
};

module.exports = { authenticateToken, checkCredentialsPresence };
