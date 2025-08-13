const {
  validateEmailUtil,
  validatePasswordUtil,
} = require("../../src/utils/validation");

describe("Validation Utils", () => {
  describe("validateEmailUtil", () => {
    test("valid emails", () => {
      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "test+tag@example.org",
      ];

      validEmails.forEach((email) => {
        expect(validateEmailUtil(email)).toBeNull();
      });
    });

    test("invalid emails", () => {
      const invalidEmails = [
        "invalidemail.com",
        "@invalidemail.com",
        "invalidemail@.com",
        "invalidemail@com",
        "invalid@",
        "invalid@@example.com",
      ];

      invalidEmails.forEach((email) => {
        expect(validateEmailUtil(email)).toBe("Invalid email format");
      });
    });
  });

  describe("validatePasswordUtil", () => {
    test("valid passwords", () => {
      const validPasswords = ["password123", "a".repeat(8), "a".repeat(64)];

      validPasswords.forEach((password) => {
        expect(validatePasswordUtil(password)).toBeNull();
      });
    });

    test("invalid passwords", () => {
      expect(validatePasswordUtil("short")).toBe(
        "Password must be between 8 and 64 characters long"
      );
      expect(validatePasswordUtil("a".repeat(65))).toBe(
        "Password must be between 8 and 64 characters long"
      );
    });
  });
});
