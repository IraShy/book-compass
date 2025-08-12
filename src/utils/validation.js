const validator = require("validator");

const validateEmailUtil = (email) => {
  if (!validator.isEmail(email)) {
    return "Invalid email format";
  }

  return null; // Valid
};

const validatePasswordUtil = (password) => {
  if (!validator.isLength(password, { min: 8, max: 64 })) {
    return "Password must be between 8 and 64 characters long";
  }

  return null; // Valid
};

module.exports = {
  validateEmailUtil,
  validatePasswordUtil,
};
