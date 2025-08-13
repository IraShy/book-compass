const jwt = require("jsonwebtoken");
const { generateToken } = require("../../src/services/authService");

process.env.JWT_SECRET = "test-secret";

describe("AuthService", () => {
  const USER_ID = 123;
  describe("generateToken", () => {
    let mockRes;

    beforeEach(() => {
      mockRes = {
        cookie: jest.fn(),
      };
    });

    test("generates JWT token and sets cookie", () => {
      generateToken(mockRes, USER_ID);

      expect(mockRes.cookie).toHaveBeenCalledTimes(1);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        "authToken",
        expect.any(String),
        {
          httpOnly: true,
          secure: false,
          sameSite: "strict",
          maxAge: 24 * 60 * 60 * 1000,
        }
      );

      const tokenCall = mockRes.cookie.mock.calls[0];
      const token = tokenCall[1];

      expect(() => jwt.verify(token, process.env.JWT_SECRET)).not.toThrow();
    });

    test("token contains correct userId", () => {
      generateToken(mockRes, USER_ID);

      const tokenCall = mockRes.cookie.mock.calls[0];
      const token = tokenCall[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.userId).toBe(USER_ID);
    });

    test("token has 24h expiration", () => {
      generateToken(mockRes, USER_ID);

      const tokenCall = mockRes.cookie.mock.calls[0];
      const token = tokenCall[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const now = Math.floor(Date.now() / 1000);
      const expectedExp = now + 24 * 60 * 60;

      expect(decoded.exp).toBeCloseTo(expectedExp, -1);
    });

    test("sets secure cookie in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      generateToken(mockRes, USER_ID);

      expect(mockRes.cookie).toHaveBeenCalledWith(
        "authToken",
        expect.any(String),
        expect.objectContaining({
          secure: true,
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });
});
