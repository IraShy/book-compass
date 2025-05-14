/**
 * Check if a book is in English
 * @param {Object} book - Book object from Google Books API
 * @returns {boolean} True if the book is in English
 */
function isEnglish(book) {
  return book.volumeInfo?.language === "en";
}

/**
 * Calculate similarity score between book title and search input
 * @param {string} bookTitle - Book title from API
 * @param {string} inputTitle - User search input
 * @returns {number} Score from 0-3 with 3 being exact match
 */
function getTitleMatchScore(bookTitle, inputTitle) {
  if (bookTitle === inputTitle) return 3; // exact match
  if (bookTitle.includes(inputTitle)) return 2; // contains input
  if (inputTitle.includes(bookTitle)) return 1; // input contains book title
  return 0; // unrelated
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

    // Rank books by title similarity
    const lowerTitle = title.toLowerCase();
    const rankedBooks = englishBooks.sort((a, b) => {
      const aTitle = a.volumeInfo?.title?.toLowerCase() || "";
      const bTitle = b.volumeInfo?.title?.toLowerCase() || "";

      const aScore = getTitleMatchScore(aTitle, lowerTitle);
      const bScore = getTitleMatchScore(bTitle, lowerTitle);

      return bScore - aScore;
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
    console.error("Google Books API error:", error.message);
    return null;
  }
}

module.exports = fetchBookFromGoogle;
