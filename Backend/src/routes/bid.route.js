const express = require("express");
const { authenticate, optionalAuthenticate, authorize } = require("../middleware/auth.middleware");
const {
  placeBid,
  getHighestBid,
  getMyBids,
  getBidsForLot,
  closeAuction,
} = require("../controllers/bid.controller");

const router = express.Router();

// Buyer-only
router.post("/place-bid", authenticate, authorize("buyer"), placeBid);
router.get("/my-bids", authenticate, authorize("buyer"), getMyBids);

// Public routes (optional auth)
router.get("/lots/:lotId/highest", optionalAuthenticate, getHighestBid);
router.get("/lots/:lotId", optionalAuthenticate, getBidsForLot);

// Close auction (FPO owner or Admin)
router.post("/lots/:lotId/close", authenticate, authorize(["fpo", "admin"]), closeAuction);

module.exports = router;
