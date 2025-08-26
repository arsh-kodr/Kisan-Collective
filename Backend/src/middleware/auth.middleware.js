const { verifyAccessToken } = require("../utils/token.util");

const authenticate = (req, res, next) => {
  try {
    // check Authorization header first
    const authHeader = req.headers.authorization;
    let token;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.accessToken) {
     
      token = req.cookies.accessToken;
    }

    if (!token) return res.status(401).json({ message: "No token provided" });

    const payload = verifyAccessToken(token);
    // attach standard claims
    req.user = { sub: payload.sub, role: payload.role };
    next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ message: "Invalid or expired token" });
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

module.exports = { authenticate, authorize };
