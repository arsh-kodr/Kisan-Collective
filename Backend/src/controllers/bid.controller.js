// src/controllers/bid.controller.js
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
      return res
        .status(400)
        .json({ message: "lotId and amount are required" });

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
    const bid = await Bid.create({
      lot: lotId,
      bidder: req.user.sub,
      amount: numericAmount,
      meta: {
        placedByUsername: req.user?.username || null,
      },
    });

    // Emit socket.io event so clients can update in real-time
    try {
      const io = req.app.get("io");
      if (io) {
        // emit to lot room (preferred)
        io.to(`lot:${lotId}`).emit(`bid:new:${lotId}`, {
          bid: {
            _id: bid._id,
            amount: bid.amount,
            createdAt: bid.createdAt,
            bidder: {
              _id: req.user.sub,
              username: req.user.username,
            },
          },
          lotId,
        });

        // global broadcast (optional) for admin monitor dashboards
        io.emit("bid:new", {
          bid: {
            _id: bid._id,
            amount: bid.amount,
            createdAt: bid.createdAt,
            bidder: {
              _id: req.user.sub,
              username: req.user.username,
            },
          },
          lotId,
        });
      }
    } catch (emitErr) {
      console.error("Socket emit error:", emitErr); // do not fail the request for socket errors
    }

    return res.status(201).json({ message: "Bid placed successfully", bid });
  } catch (err) {
    console.error("placeBid error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/bids/lots/:lotId/highest
 * Public - returns single highest bid or null
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
 * Auth: buyer
 */
const getMyBids = async (req, res) => {
  try {
    const bids = await Bid.find({ bidder: req.user.sub })
      .sort({ createdAt: -1 })
      .populate("lot", "name status totalQuantity");
    return res.json({ bids });
  } catch (err) {
    console.error("getMyBids error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET /api/bids/lots/:lotId
 * Public or optional auth (depending on your route middleware)
 */
const getBidsForLot = async (req, res) => {
  try {
    const { lotId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(lotId))
      return res.status(400).json({ message: "Invalid lotId" });

    const lot = await Lot.findById(lotId);
    if (!lot) return res.status(404).json({ message: "Lot not found" });

    // Optional extra checks for req.user (if present)
    // (your existing logic allowed public reads)
    const bids = await Bid.find({ lot: lotId })
      .sort({ amount: -1, createdAt: -1 })
      .populate("bidder", "username email");

    return res.json({ bids });
  } catch (err) {
    console.error("getBidsForLot error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST /api/bids/lots/:lotId/close
 * Auth: FPO owner or admin
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

    const winningBid = await Bid.findOne({ lot: lotId }).sort({ amount: -1 });
    if (!winningBid) return res.status(400).json({ message: "No bids to close" });

    lot.status = "sold";
    lot.winningBid = winningBid._id;
    await lot.save();

    // emit auction closed event (optional)
    try {
      const io = req.app.get("io");
      if (io) {
        io.to(`lot:${lotId}`).emit(`lot:closed:${lotId}`, {
          lotId,
          winningBid: {
            _id: winningBid._id,
            amount: winningBid.amount,
            bidder: winningBid.bidder,
          },
        });
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
