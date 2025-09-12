const { LRUCache } = require("lru-cache");
const logger = require("../utils/logger");

const bookCache = new LRUCache({
  max: 10_000, // Max 10,000 books
  ttl: 1000 * 60 * 60 * 24 * 7 * 4, // 4 weeks
  // ttl: 1000 * 60,
  updateAgeOnGet: true,
  allowStale: false,
});

function normalizeString(str) {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\b(the|and|a|an)\b/g, "")
    .replace(/\s+/g, " ");
}

function createCacheKey(title, authors) {
  const normalizedTitle = normalizeString(title);
  const normalizedAuthors = authors.map(normalizeString).filter(Boolean).sort();
  return `${normalizedTitle}|${normalizedAuthors.join("|")}`;
}

function setCachedBook(title, authors, bookData) {
  const key = createCacheKey(title, authors);
  bookCache.set(key, bookData);
  logger.info("Book cached", { key });
}

function getCachedBook(title, authors) {
  const searchKey = createCacheKey(title, authors);
  const book = bookCache.get(searchKey);
  if (book) {
    logger.info("Book cache hit", { key: searchKey });
  } else {
    logger.info("Book cache miss", { key: searchKey });
  }
  return book;
}

function clearCache() {
  bookCache.clear();
}

module.exports = {
  getCachedBook,
  setCachedBook,
  clearCache,
};
