const jwt = require("jsonwebtoken");
const dayjs = require("dayjs");

const generateAccessToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.ACCESS_TOKEN_EXP || "15m";
  return jwt.sign(payload, secret, { expiresIn });
};

const generateRefreshToken = (payload) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  const expiresIn = process.env.REFRESH_TOKEN_EXP || "7d";
  return jwt.sign(payload, secret, { expiresIn });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

const calculateExpiryDate = (expiryStr) => {
  // helper: parse strings like "7d" or "15m"
  if (!expiryStr) return dayjs().add(7, "day").toDate();
  const unit = expiryStr.endsWith("d") ? "day" : expiryStr.endsWith("m") ? "minute" : null;
  const num = parseInt(expiryStr, 10);
  if (unit === "day") return dayjs().add(num, "day").toDate();
  if (unit === "minute") return dayjs().add(num, "minute").toDate();
  // fallback
  return dayjs().add(7, "day").toDate();
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  calculateExpiryDate,
};
