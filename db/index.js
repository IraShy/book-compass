const { Pool } = require("pg");
const dotenv = require("dotenv");

const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenv.config({ path: envFile });

// Build connection string with automatic encoding
const connectionString = (() => {
  const { DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME } = process.env;
  const password = encodeURIComponent(DB_PASSWORD);
  return `postgresql://${DB_USER}:${password}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
})();

const pool = new Pool({
  connectionString: connectionString,
  ssl: !connectionString?.includes("localhost")
    ? { rejectUnauthorized: false }
    : false,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  end: () => pool.end(),
};
