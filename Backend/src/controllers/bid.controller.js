const mongoose = require("mongoose");
const Bid = require("../models/bid.model");
const Lot = require("../models/lot.model");

// POST /api/bids/place-bid (buyer only)
const placeBid = async (req, res) => {
  try {
    const { lotId, amount } = req.body;

    if (!lotId || !amount) return res.status(400).json({ message: "lotId and amount are required" });
    if (!mongoose.Types.ObjectId.isValid(lotId)) return res.status(400).json({ message: "Invalid lotId" });
    if (amount <= 0) return res.status(400).json({ message: "Bid amount must be > 0" });

    const lot = await Lot.findById(lotId).populate("listings");
    if (!lot) return res.status(404).json({ message: "Lot not found" });
    if (lot.status !== "open") return res.status(400).json({ message: "Lot is not open for bidding" });

    // FPO cannot bid on own lot
    if (req.user.role === "fpo" && String(lot.fpo) === req.user.sub) {
      return res.status(403).json({ message: "FPO cannot bid on own lot" });
    }

    // Buyers only
    if (req.user.role !== "buyer") return res.status(403).json({ message: "Only buyers can place bids" });

    // Ensure strictly higher than current highest bid
    const highest = await Bid.findOne({ lot: lotId }).sort({ amount: -1 });
    if (highest && amount <= highest.amount) {
      return res.status(400).json({ message: `Bid must be greater than current highest (${highest.amount})` });
    }

    const bid = await Bid.create({ lot: lotId, bidder: req.user.sub, amount });
    res.status(201).json({ message: "Bid placed successfully", bid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/bids/lots/:lotId/highest (public)
const getHighestBid = async (req, res) => {
  try {
    const { lotId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(lotId)) return res.status(400).json({ message: "Invalid lotId" });

    const bid = await Bid.findOne({ lot: lotId }).sort({ amount: -1 }).populate("bidder", "username email");
    res.json({ highestBid: bid || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/bids/my-bids (buyer only)
const getMyBids = async (req, res) => {
  try {
    const bids = await Bid.find({ bidder: req.user.sub })
      .sort({ createdAt: -1 })
      .populate("lot", "name status totalQuantity");
    res.json({ bids });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/bids/lots/:lotId (public or auth)
const getBidsForLot = async (req, res) => {
  try {
    const { lotId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(lotId)) return res.status(400).json({ message: "Invalid lotId" });

    const lot = await Lot.findById(lotId);
    if (!lot) return res.status(404).json({ message: "Lot not found" });

    // Optional access check: only FPO/admin get extra info
    if (req.user) {
      if (req.user.role !== "admin" && String(lot.fpo) !== req.user.sub) {
        // guest or other buyers: read-only access
      }
    }

    const bids = await Bid.find({ lot: lotId })
      .sort({ amount: -1, createdAt: -1 })
      .populate("bidder", "username email");

    res.json({ bids });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/bids/lots/:lotId/close (FPO/Admin)
const closeAuction = async (req, res) => {
  try {
    const { lotId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(lotId)) return res.status(400).json({ message: "Invalid lotId" });

    const lot = await Lot.findById(lotId);
    if (!lot) return res.status(404).json({ message: "Lot not found" });
    if (lot.status !== "open") return res.status(400).json({ message: "Lot is not open" });

    // Only FPO owner or Admin
    if (req.user.role !== "admin" && String(lot.fpo) !== req.user.sub) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const winningBid = await Bid.findOne({ lot: lotId }).sort({ amount: -1 });
    if (!winningBid) return res.status(400).json({ message: "No bids to close" });

    lot.status = "sold";
    lot.winningBid = winningBid._id;
    await lot.save();

    res.json({ message: "Auction closed", winningBid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { placeBid, getHighestBid, getMyBids, getBidsForLot, closeAuction };
