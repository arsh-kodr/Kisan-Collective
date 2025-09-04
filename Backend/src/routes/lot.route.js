// src/routes/lot.route.js
const express = require("express");
const { authenticate, optionalAuthenticate, authorize } = require("../middleware/auth.middleware");
const {
  createLot,
  getLots,
  getMyLots,
  closeLot,
  getLotById,
  poolListingsIntoLot
  
} = require("../controllers/lot.controller");

const router = express.Router();

// 🔹 Public (guest or logged-in can view)
router.get("/", optionalAuthenticate, getLots);
router.get("/:id", optionalAuthenticate, getLotById);

// 🔹 FPO-only actions
router.get("/me/lots", authenticate, authorize("fpo"), getMyLots);
router.post("/", authenticate, authorize("fpo"), createLot);
router.post("/pool", authenticate, authorize("fpo"), poolListingsIntoLot);


// 🔹 Close auction (FPO only)
router.post("/:lotId/close", authenticate, authorize("fpo"), closeLot);

module.exports = router;
