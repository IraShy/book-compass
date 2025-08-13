const jwt = require("jsonwebtoken");
const {
  checkCredentialsPresence,
  validateEmailFormat,
  validatePasswordFormat,
} = require("../../src/middlewares/auth");

process.env.JWT_SECRET = "test-secret";

describe("Auth Middleware", () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      cookies: {},
      body: {},
      log: {
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe("checkCredentialsPresence", () => {
    test("valid credentials", () => {
      mockReq.body = { email: "test@example.com", password: "password123" };

      checkCredentialsPresence(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test("missing email", () => {
      mockReq.body = { password: "password123" };

      checkCredentialsPresence(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Email is required" });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test("missing password", () => {
      mockReq.body = { email: "test@example.com" };

      checkCredentialsPresence(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Password is required",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("validateEmailFormat", () => {
    test("valid email", () => {
      mockReq.body = { email: "test@example.com" };

      validateEmailFormat(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test("invalid email", () => {
      mockReq.body = { email: "invalid-email" };

      validateEmailFormat(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Invalid email format",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("validatePasswordFormat", () => {
    test("valid password", () => {
      mockReq.body = { password: "password123", email: "test@example.com" };

      validatePasswordFormat(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    test("invalid password", () => {
      mockReq.body = { password: "short", email: "test@example.com" };

      validatePasswordFormat(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Password must be between 8 and 64 characters long",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
