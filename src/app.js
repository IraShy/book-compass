const express = require("express");
const cors = require("cors");
const app = express();
const cookieParser = require("cookie-parser");

const db = require("../db");
const usersRoutes = require("./routes/users");
const booksRoutes = require("./routes/books");
const reviewsRoutes = require("./routes/reviews");
const { requestLogger } = require("./middlewares/requestLogger");

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(requestLogger);

app.use("/api/users", usersRoutes);
app.use("/api/books", booksRoutes);
app.use("/api/reviews", reviewsRoutes);

// Health check route (for testing server)
app.get("/api/health", (req, res) => {
  res.json({ status: "Book Compass backend is running" });
});

// Test route to check DB connection
app.get("/ping-db", async (req, res) => {
  try {
    const result = await db.query("SELECT CURRENT_USER, CURRENT_DATABASE();");
    const tableTest = await db.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
    );

    req.log.info("Database connection test successful");
    res.json({
      success: true,
      connection: result.rows[0],
      tables: tableTest.rows.map((row) => row.table_name),
    });
  } catch (error) {
    req.log.error("Database connection test failed", {
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      success: false,
      error: "Database connection failed",
      details: error.message,
    });
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
