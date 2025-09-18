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
    const userId = req.user.sub; // from your auth middleware

    // 1️⃣ Validate input
    if (!lotId || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid lot ID or bid amount" });
    }

    // 2️⃣ Fetch the lot
    const lot = await Lot.findById(lotId).populate("bids");
    if (!lot) return res.status(404).json({ message: "Lot not found" });
    if (lot.status !== "open") {
      return res.status(400).json({ message: "Lot is not open for bidding" });
    }

    // 3️⃣ Check minimum bid
    const highestBidAmount = lot.bids.length
      ? Math.max(...lot.bids.map((b) => b.amount))
      : 0;

    const minRequired = Math.max(highestBidAmount + 1, lot.basePrice);
    if (amount < minRequired) {
      return res.status(400).json({
        message: `Bid must be at least ₹${minRequired}`,
      });
    }

    // 4️⃣ Create the bid
    const bid = await Bid.create({
      lot: lotId,
      bidder: userId,
      amount,
    });

    // 5️⃣ Add bid to lot
    lot.bids.push(bid._id);
    await lot.save();

    // 6️⃣ Populate bidder info before sending response
    const populatedBid = await Bid.findById(bid._id).populate(
      "bidder",
      "fullName username"
    );

    // 7️⃣ Emit event to the lot room
    const io = getIO(); // make sure getIO() returns your Socket.io instance
    io.to(`lot:${lotId}`).emit("bid:new", { bid: populatedBid });

    return res.status(201).json(populatedBid);
  } catch (err) {
    console.error("placeBid error:", err);
    // Send more detailed message if possible
    res.status(500).json({
      message: err.message || "Server error while placing bid",
    });
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
