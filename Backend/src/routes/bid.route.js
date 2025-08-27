const express = require("express");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const {
  placeBid,
  getHighestBid,
  getMyBids,
  getBidsForLot,
  closeAuction,
} = require("../controllers/bid.controller");

const router = express.Router();

// Buyer actions
router.post("/place-bid", authenticate, authorize("buyer"), placeBid);
router.get("/my-bids", authenticate, authorize("buyer"), getMyBids);

// Public (any authenticated) read
router.get("/lots/:lotId/highest", authenticate, getHighestBid);
router.get("/lots/:lotId", authenticate, getBidsForLot);

// Close auction (FPO owner or Admin)
router.post("/lots/:lotId/close", authenticate, closeAuction);

module.exports = router;
