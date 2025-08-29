const {
  validateEmailUtil,
  validatePasswordUtil,
  validateBookIdUtil,
  validateRatingUtil,
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

  describe("validateBookIdUtil", () => {
    test("valid book IDs", () => {
      expect(validateBookIdUtil("1")).toBeNull();
      expect(validateBookIdUtil("123")).toBeNull();
      expect(validateBookIdUtil("abcd82n")).toBeNull();
    });

    test("invalid book IDs", () => {
      expect(validateBookIdUtil(null)).toBe("Valid book ID is required");
      expect(validateBookIdUtil("")).toBe("Valid book ID is required");
      expect(validateBookIdUtil("  ")).toBe("Valid book ID is required");
      expect(validateBookIdUtil(3)).toBe("Valid book ID is required");
      expect(validateBookIdUtil(-7)).toBe("Valid book ID is required");
      expect(validateBookIdUtil(0)).toBe("Valid book ID is required");
    });
  });

  describe("validateRatingUtil", () => {
    test("valid ratings", () => {
      for (let i = 1; i <= 10; i++) {
        expect(validateRatingUtil(i)).toBeNull();
      }
    });

    test("invalid ratings", () => {
      expect(validateRatingUtil(0)).toBe(
        "Rating must be an integer between 1 and 10"
      );
      expect(validateRatingUtil(11)).toBe(
        "Rating must be an integer between 1 and 10"
      );
      expect(validateRatingUtil(null)).toBe(
        "Rating must be an integer between 1 and 10"
      );
      expect(validateRatingUtil("5")).toBe(
        "Rating must be an integer between 1 and 10"
      );
      expect(validateRatingUtil(5.5)).toBe(
        "Rating must be an integer between 1 and 10"
      );
    });
  });
});
