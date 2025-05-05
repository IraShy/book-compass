const app = require("./app");
const userRoutes = require("./routes/users");

const PORT = process.env.PORT || 8000;

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(process.env.DATABASE_URL);
});

module.exports = app;
