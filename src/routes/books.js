const express = require("express");
const { decodeSearchParams } = require("../middlewares/decodeTitle");
const { findOrAddBook } = require("../controllers/booksController");

const router = express.Router();

/**
 * @route GET /books/find
 * @desc Find a book by title or add it from Google Books API
 * @access Public
 */
router.get("/find", decodeSearchParams, findOrAddBook);

module.exports = router;
