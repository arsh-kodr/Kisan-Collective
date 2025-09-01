const Lot = require("../models/lot.model");
const Listing = require("../models/listing.model");
const Bid = require("../models/bid.model");

// ===============================
// Create Lot (FPO pools listings)
// ===============================
const createLot = async (req, res) => {
  try {
    const { name, listingId } = req.body;
    if (!name) return res.status(400).json({ message: "Lot name is required" });
    if (!listingId || !listingId.length)
      return res.status(400).json({ message: "Select at least one listing" });

    // Fetch open listings not already pooled
    const listings = await Listing.find({
      _id: { $in: listingId },
      status: "open",
      lot: null,
    });

    if (!listings.length) {
      return res.status(400).json({ message: "No eligible listings to pool" });
    }

    // Compute total quantity
    const totalQuantity = listings.reduce(
      (sum, l) => sum + (l.quantityKg || 0),
      0
    );

    // Create lot
    const lot = await Lot.create({
      name,
      fpo: req.user.sub,
      listings: listings.map((l) => l._id),
      totalQuantity,
      status: "open",
    });

    // Mark listings as pooled and link to lot
    await Listing.updateMany(
      { _id: { $in: listings.map((l) => l._id) } },
      { $set: { status: "pooled", lot: lot._id } }
    );

    res.status(201).json({ message: "Lot created successfully", lot });
  } catch (err) {
    console.error("Error in createLot:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// Get All Lots (buyers/FPOs)
// ===============================
const getLots = async (req, res) => {
  try {
    const lots = await Lot.find()
      .populate("fpo", "username email")
      .populate("listings");

    // fetch highest bid for each lot
    const lotsWithHighestBid = await Promise.all(
      lots.map(async (lot) => {
        const highestBid = await Bid.findOne({ lot: lot._id })
          .sort({ amount: -1 })
          .populate("bidder", "username email");

        return {
          ...lot.toObject(),
          highestBid: highestBid || null,
        };
      })
    );

    res.json(lotsWithHighestBid);
  } catch (err) {
    console.error("Error fetching lots:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// Get Lots created by this FPO
// ===============================
const getMyLots = async (req, res) => {
  try {
    const lots = await Lot.find({ fpo: req.user._id })
      .populate("fpo", "username email")
      .populate("listings");

    const lotsWithHighestBid = await Promise.all(
      lots.map(async (lot) => {
        const highestBid = await Bid.findOne({ lot: lot._id })
          .sort({ amount: -1 })
          .populate("bidder", "username email");

        return {
          ...lot.toObject(),
          highestBid: highestBid || null,
        };
      })
    );

    res.json(lotsWithHighestBid);
  } catch (err) {
    console.error("Error fetching FPO lots:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// Close Auction (FPO action)
// ===============================
const closeLot = async (req, res) => {
  try {
    const { lotId } = req.params;

    const lot = await Lot.findById(lotId).populate("listings");
    if (!lot) return res.status(404).json({ message: "Lot not found" });

    if (lot.status !== "open") {
      return res
        .status(400)
        .json({ message: "Lot already closed or processed" });
    }

    // Find highest bid
    const topBid = await Bid.findOne({ lot: lotId })
      .sort({ amount: -1 })
      .populate("bidder", "username email");

    if (!topBid) {
      // No bids placed
      lot.status = "closed";
      await lot.save();
      return res.json({ message: "Lot closed with no bids", lot });
    }

    // Set winning bid + close lot
    lot.status = "closed";
    lot.winningBid = topBid._id;
    await lot.save();

    res.json({
      message: "Lot closed successfully. Winner declared.",
      lot,
      winner: topBid,
    });
  } catch (err) {
    console.error("Error in closeLot:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// Get lot by ID
// ===============================
const getLotById = async (req, res) => {
  try {
    const { id } = req.params;

    const lot = await Lot.findById(id)
      .populate("fpo", "username email")
      .populate("listings"); // so you get crop, quantityKg, etc.

    if (!lot) return res.status(404).json({ message: "Lot not found" });

    // fetch bids for this lot
    const bids = await Bid.find({ lot: id })
      .sort({ amount: -1 })
      .populate("bidder", "username email");

    res.json({
      ...lot.toObject(),
      bids, // attach bids array
    });
  } catch (err) {
    console.error("Error fetching lot details:", err);
    res.status(500).json({ message: "Server error" });
  }
};



module.exports = {
  createLot,
  getLots,
  getMyLots,
  closeLot,
  getLotById,   // ✅ add this
};