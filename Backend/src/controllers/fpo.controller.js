// src/controllers/fpo.controller.js
const Listing = require("../models/listing.model");
const Lot = require("../models/lot.model");
const Bid = require("../models/bid.model");

const getFpoStats = async (req, res) => {
  try {
    const fpoId = req.user._id;

    const pendingListings = await Listing.countDocuments({ status: "pending" });
    const approvedListings = await Listing.countDocuments({ status: "open" });
    const lotsCreated = await Lot.countDocuments({ fpo: fpoId });
    const closedLots = await Lot.countDocuments({ fpo: fpoId, status: "closed" });

    // total revenue = sum of highest bids on closed lots
    const closedLotsWithBids = await Lot.find({ fpo: fpoId, status: "closed" }).populate("winningBid");
    const totalRevenue = closedLotsWithBids.reduce(
      (sum, lot) => sum + (lot.winningBid?.amount || 0),
      0
    );

    res.json({
      pendingListings,
      approvedListings,
      lotsCreated,
      closedLots,
      totalRevenue
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch FPO stats" });
  }
};

module.exports = { getFpoStats };
