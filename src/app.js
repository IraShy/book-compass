const express = require("express");
const app = express();

const db = require("../db");
const userRoutes = require("./routes/users");

app.use(express.json());
app.use("/api/users", userRoutes);

// Health check route (for testing server)
app.get("/api/health", (req, res) => {
  res.json({ status: "Book Compass backend is running" });
});

// Test route to check DB connection
app.get("/ping-db", async (req, res) => {
  try {
    const result = await db.query("SELECT CURRENT_USER, CURRENT_DATABASE();");
    res.json({ success: true, result: result.rows[0] });
  } catch (error) {
    console.error("Database error:", error);
    res
      .status(500)
      .json({ success: false, error: "Database connection failed" });
  }
});

module.exports = app;
