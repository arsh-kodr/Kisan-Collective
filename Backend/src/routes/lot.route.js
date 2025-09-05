// src/routes/lot.route.js
const express = require("express");
const { authenticate, optionalAuthenticate, authorize } = require("../middleware/auth.middleware");
const {
  createLot,
  getLots,
  getMyLots,
  closeLot,
  getLotById,
  poolListingsIntoLot,
} = require("../controllers/lot.controller");

const router = express.Router();

// Public
router.get("/", optionalAuthenticate, getLots);

// FPO-only actions (specific routes first)
router.get("/my-lots", authenticate, authorize("fpo"), getMyLots); // preferred
router.get("/me/lots", authenticate, authorize("fpo"), getMyLots); // alias for backward compatibility

router.post("/", authenticate, authorize("fpo"), createLot);
router.post("/pool", authenticate, authorize("fpo"), poolListingsIntoLot);

// Close auction (FPO only) - use named param
router.post("/:lotId/close", authenticate, authorize("fpo"), closeLot);

// Lot by id (catch-all) — must be last
router.get("/:id", optionalAuthenticate, getLotById);

module.exports = router;
