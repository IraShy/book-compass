const express = require("express");

const db = require("../../db");
const {
  authenticateToken,
  checkCredentialsPresence,
} = require("../middlewares/auth");
const {
  registerUser,
  loginUser,
  viewUserProfile,
  logoutUser,
} = require("../controllers/usersController");

const router = express.Router();

router.post("/register", checkCredentialsPresence, registerUser);

router.post("/login", checkCredentialsPresence, loginUser);

router.post("/logout", authenticateToken, logoutUser);

router.get("/profile", authenticateToken, viewUserProfile);

module.exports = router;
