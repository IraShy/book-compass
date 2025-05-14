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
} = require("../controllers/usersController");

const router = express.Router();

router.post("/register", checkCredentialsPresence, registerUser);

router.post("/login", checkCredentialsPresence, loginUser);

router.get("/profile", authenticateToken, viewUserProfile);

module.exports = router;
