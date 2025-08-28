// src/controllers/auth.controller.js
const User = require("../models/user.model");
const RefreshToken = require("../models/refreshToken.model");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  calculateExpiryDate,
} = require("../utils/token.util");
const bcrypt = require("bcrypt");

// cookie helper
const cookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
};

const register = async (req, res) => {
  try {
    const {
      username,
      fullName,
      email,
      password,
      mobile,
      role,
      companyName,
      gstNumber,
      companyAddress,
    } = req.body;

    if (!username || !email || !password || !mobile) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await User.findOne({
      $or: [{ username }, { email }, { mobile }],
    });
    if (existing)
      return res.status(409).json({ message: "User already exists" });
    const user = await User.create({
      username,
      fullName,
      email,
      password,
      mobile,
      role,
      companyName,
      gstNumber,
      companyAddress,
    });

    // <-- FIX: use the created instance 'user' (not User model)
    const payload = { sub: user._id, role: user.role };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const expiresAt = calculateExpiryDate(process.env.REFRESH_TOKEN_EXP);
    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt,
      createdByIp: req.ip,
    });

    // send refresh token as HttpOnly cookie, accessToken in JSON
    res.cookie("refreshToken", refreshToken, cookieOptions);

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      accessToken,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const payload = { sub: user._id, role: user.role };

    // Generate tokens
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Persist refresh token
    const expiresAt = calculateExpiryDate(process.env.REFRESH_TOKEN_EXP);
    await RefreshToken.create({
      user: user._id,
      token: refreshToken,
      expiresAt,
      createdByIp: req.ip,
    });

    // Set refresh token cookie
    res.cookie("refreshToken", refreshToken, cookieOptions);

    return res.json({
      message: "Login successful",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
};

const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    // verify token signature & payload
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (err) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    // verify in DB & not revoked & not expired
    const stored = await RefreshToken.findOne({ token });
    if (!stored || stored.revoked)
      return res.status(401).json({ message: "Refresh token revoked" });
    if (new Date() > new Date(stored.expiresAt)) {
      return res.status(401).json({ message: "Refresh token expired" });
    }

    // rotate: create new refresh token and revoke previous
    const newPayload = { sub: payload.sub, role: payload.role };
    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);
    const newExpiry = calculateExpiryDate(process.env.REFRESH_TOKEN_EXP);

    // mark old token revoked & record replacement
    stored.revoked = true;
    stored.revokedByIp = req.ip;
    stored.replacedByToken = newRefreshToken;
    await stored.save();

    // store new token
    await RefreshToken.create({
      user: payload.sub,
      token: newRefreshToken,
      expiresAt: newExpiry,
      createdByIp: req.ip,
    });

    // set new cookie
    res.cookie("refreshToken", newRefreshToken, cookieOptions);

    return res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await RefreshToken.findOneAndUpdate(
        { token },
        { revoked: true, revokedByIp: req.ip }
      );
    }
    res.clearCookie("refreshToken");
    return res.json({ message: "Logged out" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

const profile = async (req, res) => {
  try {
    const userId = req.user.sub;
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { register, login, refresh, logout, profile };
