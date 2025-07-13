const { Pool } = require("pg");
const dotenv = require("dotenv");

const envFile = process.env.NODE_ENV === "test" ? ".env.test" : ".env";
dotenv.config({ path: envFile });

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  // ssl: process.env.SSL_DISABLED ? false : { rejectUnauthorized: false },
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  end: () => pool.end(),
};
