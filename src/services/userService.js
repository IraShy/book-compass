const db = require("../../db");
const { NotFoundError } = require("../utils/errors");

async function findUserById(userId) {
  const result = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
  if (result.rows.length === 0) {
    throw new NotFoundError("User");
  }
  return result.rows[0];
}

module.exports = { findUserById };
