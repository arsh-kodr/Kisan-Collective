const express = require("express");
const router = express.Router();
const {
  register,
  login,
  refresh,
  logout,
  profile,
} = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");

// register
router.post("/register", register);

// login
router.post("/login", login);

// refresh token
router.post("/refresh", refresh);

// logout
router.post("/logout", logout);

// protected profile
router.get("/profile", authenticate, profile);

module.exports = router;
