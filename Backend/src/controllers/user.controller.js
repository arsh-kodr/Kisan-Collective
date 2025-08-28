const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");

// GET /me
const getProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.sub).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile fetched successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /me
const updateProfile = async (req, res) => {
  try {
    const updates = (({
      username,
      email,
      fullName,
      mobile,
      companyName,
      gstNumber,
      companyAddress,
    }) => ({
      username,
      email,
      fullName,
      mobile,
      companyName,
      gstNumber,
      companyAddress,
    }))(req.body);

    const user = await userModel
      .findByIdAndUpdate(req.user.sub, { $set: updates }, { new: true })
      .select("-password");

    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /me/password
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword)
      return res
        .status(400)
        .json({ message: "Both old and new passwords required" });

    const user = await userModel.findById(req.user.sub);
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Old password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /me
const deleteAccount = async (req, res) => {
  try {
    await userModel.findByIdAndDelete(req.user.sub);
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getProfile, updateProfile, changePassword, deleteAccount };
