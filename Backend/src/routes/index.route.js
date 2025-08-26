// src/routes/index.route.js
const express = require("express");
const { healthCheck } = require("../controllers/health.controller");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.route");
const listingRoutes = require("./listing.route"); 

const router = express.Router();

router.get("/health", healthCheck);

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/listings", listingRoutes);


module.exports = router;
