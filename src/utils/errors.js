class NotFoundError extends Error {
  constructor(resource = "Resource") {
    const message = `${resource} not found`;
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}

module.exports = { NotFoundError };
