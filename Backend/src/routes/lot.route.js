const express = require("express");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const {
  createLot,
  getLots,
  getMyLots,
  closeLot,
} = require("../controllers/lot.controller");

const router = express.Router();

// 🔹 Public for buyers to see all lots
router.get("/", authenticate, getLots);

// 🔹 FPO-only routes
router.get("/me/lots", authenticate, authorize("fpo"), getMyLots);
router.post("/", authenticate, authorize("fpo"), createLot);

// 🔹 Close auction (FPO ends bidding and declares winner)
router.post("/:lotId/close", authenticate, authorize("fpo"), closeLot);

module.exports = router;
