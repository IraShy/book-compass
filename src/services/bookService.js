/**
 * Check if a book is in English
 * @param {Object} book - Book object from Google Books API
 * @returns {boolean} True if the book is in English
 */
function isEnglish(book) {
  return book.volumeInfo?.language === "en";
}

/**
 * Calculate similarity score between two strings
 * @param {string} str1 - First string to compare
 * @param {string} str2 - Second string to compare
 * @returns {number} Score from 0-3 with 3 being exact match
 */
function getStringMatchScore(str1, str2) {
  if (!str1 || !str2) return 0;

  // Convert to lowercase for case-insensitive comparison
  const lower1 = str1.toLowerCase();
  const lower2 = str2.toLowerCase();

  if (lower1 === lower2) return 3; // exact match
  if (lower1.includes(lower2)) return 2; // str1 contains str2
  if (lower2.includes(lower1)) return 1; // str2 contains str1
  return 0; // unrelated
}

/**
 * Calculate similarity score between book title and search input
 * @param {string} bookTitle - Book title from API
 * @param {string} inputTitle - User search input
 * @returns {number} Score from 0-3 with 3 being exact match
 */
function getTitleMatchScore(bookTitle, inputTitle) {
  return getStringMatchScore(bookTitle, inputTitle);
}

/**
 * Calculate similarity score between book author and search input
 * @param {Array} bookAuthors - Book authors array from API
 * @param {string} inputAuthor - User search input
 * @returns {number} Score from 0-3 with 3 being exact match
 */
function getAuthorMatchScore(bookAuthors, inputAuthor) {
  if (!bookAuthors || !bookAuthors.length || !inputAuthor) return 0;

  // Find the best match among all authors
  let bestScore = 0;
  for (const author of bookAuthors) {
    const score = getStringMatchScore(author, inputAuthor);
    if (score > bestScore) bestScore = score;
    if (score === 3) break; // Exit early if we find an exact match
  }

  return bestScore;
}

/**
 * Fetch book information from Google Books API
 * @param {string} title - Book title to search for
 * @param {string} author - Optional author name
 * @returns {Object|null} Book data or null if not found
 */
async function fetchBookFromGoogle(title, author = "") {
  if (!title) return null;

  try {
    // Build search query
    const query = `intitle:${encodeURIComponent(title)}${
      author ? `+inauthor:${encodeURIComponent(author)}` : ""
    }`;

    const booksApiUrl = `https://www.googleapis.com/books/v1/volumes?q=${query}&orderBy=relevance&printType=books&maxResults=10&langRestrict=en`;

    // Fetch data from API
    const response = await fetch(booksApiUrl);

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    const books = data.items || [];

    // No results found
    if (books.length === 0) return null;

    // Filter for English books
    const englishBooks = books.filter(isEnglish);
    if (englishBooks.length === 0) return null;

    // Rank books by title and author similarity
    const lowerTitle = title.toLowerCase();
    const lowerAuthor = author ? author.toLowerCase() : "";

    const rankedBooks = englishBooks.sort((a, b) => {
      const aTitle = a.volumeInfo?.title?.toLowerCase() || "";
      const bTitle = b.volumeInfo?.title?.toLowerCase() || "";
      const aAuthors = a.volumeInfo?.authors || [];
      const bAuthors = b.volumeInfo?.authors || [];

      // Calculate title match scores
      const aTitleScore = getTitleMatchScore(aTitle, lowerTitle);
      const bTitleScore = getTitleMatchScore(bTitle, lowerTitle);

      // Calculate author match scores (only if author was provided)
      const aAuthorScore = author
        ? getAuthorMatchScore(aAuthors, lowerAuthor)
        : 0;
      const bAuthorScore = author
        ? getAuthorMatchScore(bAuthors, lowerAuthor)
        : 0;

      // Combined score with title having higher weight (multiply by 2)
      const aTotalScore = aTitleScore * 2 + aAuthorScore;
      const bTotalScore = bTitleScore * 2 + bAuthorScore;

      return bTotalScore - aTotalScore; // Sort descending
    });

    // Get best match
    const topMatch = rankedBooks[0];
    const info = topMatch.volumeInfo;

    // Extract and normalize book data
    return {
      google_books_id: topMatch.id,
      title: info.title,
      authors: info.authors || [],
      description: info.description || "",
      thumbnail: info.imageLinks?.thumbnail || "",
      smallThumbnail: info.imageLinks?.smallThumbnail || "",
    };
  } catch (error) {
    const logger = require("../utils/logger");
    logger.error("Google Books API error", {
      message: error.message,
      stack: error.stack,
      status: error.status,
      title,
      author,
    });
    return null;
  }
}

module.exports = { fetchBookFromGoogle };
