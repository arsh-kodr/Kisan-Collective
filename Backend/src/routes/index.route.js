// src/routes/index.route.js
const express = require("express");
const { healthCheck } = require("../controllers/health.controller");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.route");
const listingRoutes = require("./listing.route"); 
const lotRoutes = require("./lot.route")
const bidRoutes = require("./bid.route");  
const paymentRoutes = require("./payment.route");
const fpoRoutes = require("./fpo.route");

const router = express.Router();

router.get("/health", healthCheck);

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/listings", listingRoutes);
router.use("/lots" , lotRoutes);
router.use("/bids", bidRoutes);    
router.use("/payments", paymentRoutes);
router.use("/fpo", fpoRoutes);


module.exports = router;
