const express = require("express");
const app = express();

const db = require("../db");
const userRoutes = require("./routes/users");
const booksRoutes = require("./routes/books");
const { requestLogger } = require("./middlewares/requestLogger");

app.use(express.json());

app.use(requestLogger);

app.use("/api/users", userRoutes);
app.use("/api/books", booksRoutes);

// Health check route (for testing server)
app.get("/api/health", (req, res) => {
  res.json({ status: "Book Compass backend is running" });
});

// Test route to check DB connection
app.get("/ping-db", async (req, res) => {
  try {
    const result = await db.query("SELECT CURRENT_USER, CURRENT_DATABASE();");
    req.log.info("Database connection test successful");
    res.json({ success: true, result: result.rows[0] });
  } catch (error) {
    req.log.error("Database connection test failed", { error: error.message });
    res
      .status(500)
      .json({ success: false, error: "Database connection failed" });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  req.log.error("Unhandled error", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({ error: "Something went wrong" });
});

module.exports = app;
