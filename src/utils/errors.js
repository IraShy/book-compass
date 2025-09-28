class NotFoundError extends Error {
  constructor(resource = "Resource") {
    const message = `${resource} not found`;
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}

class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
    this.statusCode = 401;
  }
}

module.exports = { NotFoundError, UnauthorizedError };
