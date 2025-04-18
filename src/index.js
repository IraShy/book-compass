const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const db = require("../db");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check route (for testing server)
app.get("/api/health", (req, res) => {
  res.json({ status: "Book Compass backend is running ✅" });
});

// Test route to check DB connection
app.get("/ping-db", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    console.error("Database error:", err);
    res
      .status(500)
      .json({ success: false, error: "Database connection failed" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
