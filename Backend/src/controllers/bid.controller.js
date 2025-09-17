const mongoose = require("mongoose");
const Bid = require("../models/bid.model");
const Lot = require("../models/lot.model");
const { getIO } = require("../config/socket");

/**
 * POST /api/bids/place-bid
 * Body: { lotId, amount }
 * Auth: buyer
 */
const placeBid = async (req, res) => {
  try {
    const { lotId, amount } = req.body;
    const userId = req.user._id; // ✅ use _id consistently

    const lot = await Lot.findById(lotId);
    if (!lot) return res.status(404).json({ message: "Lot not found" });
    if (lot.status !== "open")
      return res.status(400).json({ message: "Lot is not open for bidding" });

    if (amount < lot.basePrice) {
      return res.status(400).json({
        message: `Bid must be at least base price: ₹${lot.basePrice}`,
      });
    }

    const highestBid = await Bid.findOne({ lot: lotId }).sort("-amount");
    if (highestBid && amount <= highestBid.amount) {
      return res.status(400).json({
        message: `Bid must be higher than current highest: ₹${highestBid.amount}`,
      });
    }

    const bid = await Bid.create({
      lot: lotId,
      bidder: userId,
      amount,
    });

    lot.bids.push(bid._id);
    await lot.save();

    // ✅ Notify only clients in this lot room
    const io = getIO();
    io.to(`lot:${lotId}`).emit("bid:new", { bid });

    return res.status(201).json(bid);
  } catch (err) {
    console.error("placeBid error:", err);
    res.status(500).json({ message: "Server error" });
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
    const bids = await Bid.find({ bidder: req.user._id }) // ✅ use _id consistently
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

    const lot = await Lot.findById(lotId);
    if (!lot) return res.status(404).json({ message: "Lot not found" });
    if (lot.status !== "open")
      return res.status(400).json({ message: "Lot is not open" });

    // Only FPO owner or admin can close
    if (req.user.role !== "admin" && String(lot.fpo) !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const winningBid = await Bid.findOne({ lot: lotId })
      .sort({ amount: -1 })
      .populate("bidder", "username email");

    if (!winningBid)
      return res.status(400).json({ message: "No bids to close" });

    lot.status = "sold";
    lot.winningBid = winningBid._id;
    await lot.save();

    const io = getIO();

    // ✅ Notify only watchers of this lot
    io.to(`lot:${lotId}`).emit("lot:closed", { lotId, winningBid });

    // ✅ Also emit globally for dashboards / listings
    io.emit("lot:closed:global", { lotId });

    return res.json({ message: "Auction closed", winningBid });
  } catch (err) {
    console.error("closeAuction error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  placeBid,
  getHighestBid,
  getMyBids,
  getBidsForLot,
  closeAuction,
};
