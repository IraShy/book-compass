const { LRUCache } = require("lru-cache");

const bookCache = new LRUCache({
  max: 10_000, // Max 10,000 books
  ttl: 1000 * 60 * 60 * 24 * 7 * 4, // 4 weeks
  //   ttl: 1000 * 60,
  updateAgeOnGet: true,
  allowStale: false,
});

function createCacheKey(title, authors) {
  const authorsStr = Array.isArray(authors) ? authors.sort().join(",") : authors || "";
  return `${title.toLowerCase()}_${authorsStr.toLowerCase()}`;
}

function getCachedBook(title, authors) {
  const key = createCacheKey(title, authors);
  return bookCache.get(key);
}

function setCachedBook(title, authors, bookData) {
  const key = createCacheKey(title, authors);
  bookCache.set(key, bookData);
}

function getCacheContents() {
  const contents = [];
  for (const [key, value] of bookCache.entries()) {
    contents.push({
      cacheKey: key,
      title: value.title,
      authors: value.authors,
      remainingTTL: (bookCache.getRemainingTTL(key) / 1000).toFixed(0) + "s",
    });
  }
  return contents;
}

module.exports = {
  getCachedBook,
  setCachedBook,
  getCacheContents,
};
