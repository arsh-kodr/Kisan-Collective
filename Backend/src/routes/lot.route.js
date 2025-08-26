const express = require("express");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const { createLot, getLots, getMyLots } = require("../controllers/lot.controller");

const router = express.Router();

//  Public for buyers to see lots
router.get("/", authenticate, getLots);

//  FPO routes
router.get("/me/lots", authenticate, authorize("fpo"), getMyLots);
router.post("/", authenticate, authorize("fpo"), createLot);

module.exports = router;
