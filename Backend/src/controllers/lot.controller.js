const Lot = require("../models/lot.model");
const Listing = require("../models/listing.model");

// FPO creates a lot by pooling listings
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

    // Compute quantity from quantityKg
    const totalQuantity = listings.reduce((sum, l) => sum + (l.quantityKg || 0), 0);

    // Create lot
    const lot = await Lot.create({
      name,
      fpo: req.user.sub,
      listings: listings.map(l => l._id),
      totalQuantity,
    });

    // Mark listings as pooled and link to lot
    await Listing.updateMany(
      { _id: { $in: listings.map(l => l._id) } },
      { $set: { status: "pooled", lot: lot._id } }
    );

    res.status(201).json({ message: "Lot created successfully", lot });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all lots (for buyers or FPOs)
const getLots = async (req, res) => {
  try {
    const lots = await Lot.find()
      .populate("fpo", "username")
      .populate({ path: "listings", select: "crop quantityKg unit status" })
      .populate({ path: "winningBid", populate: { path: "bidder", select: "username email" } });
    res.json({ lots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get lots created by this FPO
const getMyLots = async (req, res) => {
  try {
    const lots = await Lot.find({ fpo: req.user.sub })
      .populate({ path: "listings", select: "crop quantityKg unit status" })
      .populate({ path: "winningBid", populate: { path: "bidder", select: "username email" } });
    res.json({ lots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createLot, getLots, getMyLots };
