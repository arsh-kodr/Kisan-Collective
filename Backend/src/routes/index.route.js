// routes/index.route.js
const express = require("express");
const { healthCheck } = require("../controllers/health.controller");
const authRoutes = require("../routes/auth.routes");
const userRoutes = require("./user.route");

const router = express.Router();

router.get("/health", healthCheck);

router.use("/auth", authRoutes);

router.use("/user", userRoutes);


module.exports = router;
