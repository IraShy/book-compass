const express = require("express");

const {
  authenticateToken,
  checkCredentialsPresence,
  validateEmailFormat,
  validatePasswordFormat,
  requireAuth,
} = require("../middlewares/auth");
const {
  registerUser,
  loginUser,
  viewUserProfile,
  logoutUser,
  updateUserProfile,
  changePassword,
  deleteUserAccount,
} = require("../controllers/usersController");

const router = express.Router();

router.post("/register", checkCredentialsPresence, validateEmailFormat, validatePasswordFormat, registerUser);

router.post("/login", checkCredentialsPresence, validateEmailFormat, loginUser);

router.post("/logout", authenticateToken, logoutUser);

router.get("/profile", authenticateToken, requireAuth, viewUserProfile);

router.put("/profile", authenticateToken, requireAuth, updateUserProfile);

router.put("/password", authenticateToken, requireAuth, changePassword);

router.delete("/profile", authenticateToken, requireAuth, deleteUserAccount);

module.exports = router;
