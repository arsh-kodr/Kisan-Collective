const express = require("express");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} = require("../controllers/user.controller");

const router = express.Router();

// Get own profile (from DB, not just token)
router.get("/profile", authenticate, getProfile);

//  Update own profile
router.put("/profile", authenticate, updateProfile);

//  Change password
router.put("/profile/password", authenticate, changePassword);

//  Delete account
router.delete("/profile", authenticate, deleteAccount);

//  Only admin can access
router.get("/admin-dashboard", authenticate, authorize("admin"), (req, res) => {
  res.json({ message: "Welcome Admin 🚀" });
});

module.exports = router;
