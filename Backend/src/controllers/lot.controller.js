const Lot = require("../models/lot.model");
const Listing = require("../models/listing.model");

// FPO creates a lot by pooling listings
const createLot = async (req, res) => {
  try {
    const { name, listingIds } = req.body;
    if (!listingIds || !listingIds.length)
      return res.status(400).json({ message: "Select at least one listing" });

    const listings = await Listing.find({ _id: { $in: listingIds }, farmer: { $exists: true } });

    const totalQuantity = listings.reduce((sum, l) => sum + l.quantity, 0);

    const lot = await Lot.create({
      name,
      fpo: req.user.sub,
      listings: listingIds,
      totalQuantity,
    });

    res.status(201).json({ message: "Lot created successfully", lot });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all lots (for buyers or FPOs)
const getLots = async (req, res) => {
  try {
    const lots = await Lot.find().populate("fpo", "username").populate("listings");
    res.json({ lots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get lots created by this FPO
const getMyLots = async (req, res) => {
  try {
    const lots = await Lot.find({ fpo: req.user.sub }).populate("listings");
    res.json({ lots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createLot, getLots, getMyLots };
