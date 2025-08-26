// src/routes/user.route.js
const express = require("express");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();


router.get("/profile", authenticate, (req, res) => {
  res.json({
    message: "Profile fetched successfully",
    user: req.user,
  });
});

// ✅ Only admin can access
router.get("/admin-dashboard", authenticate, authorize("admin"), (req, res) => {
  res.json({ message: "Welcome Admin 🚀" });
});

module.exports = router;
