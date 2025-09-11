const mongoose = require("mongoose");
const Bid = require("../models/bid.model");
const Lot = require("../models/lot.model");

/**
 * POST /api/bids/place-bid
 * Body: { lotId, amount }
 * Auth: buyer
 */
const placeBid = async (req, res) => {
  try {
    const { lotId, amount } = req.body;

    if (!lotId || typeof amount === "undefined")
      return res.status(400).json({ message: "lotId and amount are required" });

    if (!mongoose.Types.ObjectId.isValid(lotId))
      return res.status(400).json({ message: "Invalid lotId" });

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0)
      return res.status(400).json({ message: "Bid amount must be > 0" });

    const lot = await Lot.findById(lotId).populate("listings");
    if (!lot) return res.status(404).json({ message: "Lot not found" });
    if (lot.status !== "open")
      return res.status(400).json({ message: "Lot is not open for bidding" });

    // FPO cannot bid on own lot
    if (req.user.role === "fpo" && String(lot.fpo) === req.user.sub) {
      return res.status(403).json({ message: "FPO cannot bid on own lot" });
    }

    // Buyers only
    if (req.user.role !== "buyer") {
      return res.status(403).json({ message: "Only buyers can place bids" });
    }

    // Ensure strictly higher than current highest bid
    const highest = await Bid.findOne({ lot: lotId }).sort({ amount: -1 });
    if (highest && numericAmount <= highest.amount) {
      return res
        .status(400)
        .json({ message: `Bid must be greater than current highest (${highest.amount})` });
    }

    // Create bid
    let bid = await Bid.create({
      lot: lotId,
      bidder: req.user.sub,
      amount: numericAmount,
      meta: { placedByUsername: req.user?.username || null },
    });

    // Populate bidder before sending response
    bid = await bid.populate("bidder", "username email");

    // Emit socket.io events
    try {
      const io = req.app.get("io");
      if (io) {
        const payload = { bid, lotId };

        io.to(`lot:${lotId}`).emit(`bid:new:${lotId}`, payload);
        io.emit("bid:new", payload); // optional global broadcast
      }
    } catch (emitErr) {
      console.error("Socket emit error:", emitErr);
    }

    return res.status(201).json({ message: "Bid placed successfully", bid });
  } catch (err) {
    console.error("placeBid error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/bids/lots/:lotId/highest
 */
const getHighestBid = async (req, res) => {
  try {
    const { lotId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(lotId))
      return res.status(400).json({ message: "Invalid lotId" });

    const bid = await Bid.findOne({ lot: lotId })
      .sort({ amount: -1 })
      .populate("bidder", "username email");

    return res.json({ highestBid: bid || null });
  } catch (err) {
    console.error("getHighestBid error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/bids/my-bids
 */
const getMyBids = async (req, res) => {
  try {
    const bids = await Bid.find({ bidder: req.user.sub })
      .populate("lot")
      .populate("bidder", "username email")
      .sort({ createdAt: -1 });

    res.json(bids);
  } catch (err) {
    console.error("getMyBids error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/bids/lots/:lotId
 * Returns all bids for a specific lot + lot info
 */
const getBidsForLot = async (req, res) => {
  try {
    const { lotId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(lotId))
      return res.status(400).json({ message: "Invalid lotId" });

    const lot = await Lot.findById(lotId);
    if (!lot) return res.status(404).json({ message: "Lot not found" });

    const bids = await Bid.find({ lot: lotId })
      .populate("bidder", "username email")
      .sort({ amount: -1, createdAt: 1 }); // highest first

    res.json({ lot, bids });
  } catch (err) {
    console.error("getBidsForLot error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/bids/lots/:lotId/close
 */
const closeAuction = async (req, res) => {
  try {
    const { lotId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(lotId))
      return res.status(400).json({ message: "Invalid lotId" });

    const lot = await Lot.findById(lotId);
    if (!lot) return res.status(404).json({ message: "Lot not found" });
    if (lot.status !== "open") return res.status(400).json({ message: "Lot is not open" });

    // Only FPO owner or Admin
    if (req.user.role !== "admin" && String(lot.fpo) !== req.user.sub) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const winningBid = await Bid.findOne({ lot: lotId }).sort({ amount: -1 }).populate("bidder", "username email");
    if (!winningBid) return res.status(400).json({ message: "No bids to close" });

    lot.status = "sold";
    lot.winningBid = winningBid._id;
    await lot.save();

    // Emit socket event
    try {
      const io = req.app.get("io");
      if (io) {
        io.to(`lot:${lotId}`).emit(`lot:closed:${lotId}`, { lotId, winningBid });
        io.emit("lot:closed", { lotId, winningBid: winningBid._id });
      }
    } catch (emitErr) {
      console.error("Socket emit error (closeAuction):", emitErr);
    }

    return res.json({ message: "Auction closed", winningBid });
  } catch (err) {
    console.error("closeAuction error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  placeBid,
  getHighestBid,
  getMyBids,
  getBidsForLot,
  closeAuction,
};
