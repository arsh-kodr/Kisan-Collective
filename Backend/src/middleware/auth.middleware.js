// src/middleware/auth.middleware.js
const { verifyAccessToken } = require("../utils/token.util");

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) return res.status(401).json({ message: "No token provided" });

    const payload = verifyAccessToken(token);
    req.user = { sub: payload.sub, role: payload.role };
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// 👇 NEW: does not throw if no token
const optionalAuthenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) return next(); // just skip if no token

    const payload = verifyAccessToken(token);
    req.user = { sub: payload.sub, role: payload.role };
    next();
  } catch (err) {
    console.warn("Optional auth failed, continuing as guest");
    next(); // don’t block request
  }
};

const authorize = (roles = []) => {
  if (typeof roles === "string") roles = [roles];
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: "Unauthenticated" });
    if (roles.length && !roles.includes(req.user.role))
      return res.status(403).json({ message: "Forbidden" });
    next();
  };
};

module.exports = { authenticate, optionalAuthenticate, authorize };
