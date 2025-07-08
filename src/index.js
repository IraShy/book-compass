const app = require("./app");
const userRoutes = require("./routes/users");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 8000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Start server
app.listen(PORT, () => {
  logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;
