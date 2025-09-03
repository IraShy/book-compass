const express = require("express");

const db = require("../../db");
const {
  authenticateToken,
  checkCredentialsPresence,
  validateEmailFormat,
  validatePasswordFormat,
} = require("../middlewares/auth");
const { registerUser, loginUser, viewUserProfile, logoutUser } = require("../controllers/usersController");

const router = express.Router();

router.post("/register", checkCredentialsPresence, validateEmailFormat, validatePasswordFormat, registerUser);

router.post("/login", checkCredentialsPresence, validateEmailFormat, loginUser);

router.post("/logout", authenticateToken, logoutUser);

router.get("/profile", authenticateToken, viewUserProfile);

module.exports = router;
