const express = require("express");

const {
  authenticateToken,
  checkCredentialsPresence,
  validateEmailFormat,
  validatePasswordFormat,
} = require("../middlewares/auth");
const {
  registerUser,
  loginUser,
  viewUserProfile,
  logoutUser,
  updateUserProfile,
} = require("../controllers/usersController");

const router = express.Router();

router.post("/register", checkCredentialsPresence, validateEmailFormat, validatePasswordFormat, registerUser);

router.post("/login", checkCredentialsPresence, validateEmailFormat, loginUser);

router.post("/logout", authenticateToken, logoutUser);

router.get("/profile", authenticateToken, viewUserProfile);

router.put("/profile", authenticateToken, updateUserProfile);

module.exports = router;
