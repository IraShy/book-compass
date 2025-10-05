const express = require("express");
const cors = require("cors");
const app = express();
const cookieParser = require("cookie-parser");

const db = require("../db");
const usersRoutes = require("./routes/users");
const booksRoutes = require("./routes/books");
const reviewsRoutes = require("./routes/reviews");
const recommendationsRoutes = require("./routes/recommendations");
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
app.use("/api/recommendations", recommendationsRoutes);

// Health check route (for testing server)
app.get("/api/health", async (req, res) => {
  const start = Date.now();
  const services = {};

  // DB check
  try {
    await db.query("SELECT 1;");
    services.db = "ok";
  } catch (err) {
    services.db = "error";
    req.log.error("Health check: DB connectivity failed", { error: err.message });
  }

  // Google Book API check
  try {
    const response = await fetch("https://www.googleapis.com/books/v1/volumes?q=test&maxResults=1");
    services.googleBooks = response.ok ? "ok" : "error";
  } catch (err) {
    services.googleBooks = "error";
    req.log.error("Health check: Google Books API failed", { error: err.message });
  }

  // Gemini check
  services.gemini = process.env.GEMINI_API_KEY ? "ok" : "error";

  const latency = Date.now() - start;

  // Determine overall status
  const criticalServices = ["db", "googleBooks", "gemini"];
  const hasCriticalFailure = criticalServices.some((service) => services[service] === "error");
  const hasAnyFailure = Object.values(services).includes("error");

  const health = {
    status: hasCriticalFailure ? "unhealthy" : hasAnyFailure ? "degraded" : "healthy",
    services,
    latency_ms: latency,
    timestamp: new Date().toISOString(),
  };

  if (health.status !== "healthy") {
    req.log.warn("Health degradation detected", health);
  }

  res.json(health);
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
app.use((err, req, res, _next) => {
  req.log.error("Unhandled error", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({ error: "Something went wrong" });
});

module.exports = app;
