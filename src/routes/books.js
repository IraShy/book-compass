const express = require("express");
const { decodeSearchParams } = require("../middlewares/bookParams");
const { findOrAddBook, getBookById } = require("../controllers/booksController");

const router = express.Router();

/**
 * @route GET /books/find
 * @desc Find a book by title or add it from Google Books API
 * @access Public
 */
router.get("/find", decodeSearchParams, findOrAddBook);

router.get("/:id", getBookById);

module.exports = router;
