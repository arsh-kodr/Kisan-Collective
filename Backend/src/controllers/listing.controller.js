const Listing = require("../models/listing.model");
const Lot = require("../models/lot.model");
const User = require("../models/user.model");

// Farmer creates new listing (default = pending)
const createListing = async (req, res) => {
  try {
    const { crop, quantityKg, unit, harvestDate, mandiPriceAtEntry, expectedPricePerKg, location, photos } = req.body;

    if (!crop || !quantityKg || !harvestDate) {
      return res.status(400).json({ message: "Crop, quantity, and harvest date are required" });
    }

    const listingData = {
      crop,
      quantityKg,
      harvestDate,
      createdBy: req.user.sub,
      status: "pending", // ⬅️ FPO must approve before becoming open
    };

    if (unit) listingData.unit = unit;
    if (mandiPriceAtEntry) listingData.mandiPriceAtEntry = mandiPriceAtEntry;
    if (expectedPricePerKg) listingData.expectedPricePerKg = expectedPricePerKg;
    if (location) listingData.location = location;
    if (photos) listingData.photos = photos;

    const listing = await Listing.create(listingData);

    res.status(201).json({ message: "Listing submitted for FPO approval", listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Public / FPO view (only open listings)
const getListings = async (req, res) => {
  try {
    const listings = await Listing.find({ status: "open" })
      .populate("createdBy", "username fullName role")
      .populate("lot", "name status");
    res.json({ listings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Farmer-only listings
const getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ createdBy: req.user.sub })
      .populate("lot", "name status");
    res.json({ listings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Single listing
const getListingById = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate("createdBy", "username fullName role")
      .populate("lot", "name status");
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    res.json({ listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update listing (farmer only)
const updateListing = async (req, res) => {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, createdBy: req.user.sub });
    if (!listing) return res.status(404).json({ message: "Listing not found or unauthorized" });

    const allowedFields = ["crop", "quantityKg", "unit", "harvestDate", "mandiPriceAtEntry", "expectedPricePerKg", "location", "photos"];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    Object.assign(listing, updates);
    await listing.save();

    res.json({ message: "Listing updated successfully", listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete listing (farmer only)
const deleteListing = async (req, res) => {
  try {
    const listing = await Listing.findOneAndDelete({ _id: req.params.id, createdBy: req.user.sub });
    if (!listing) return res.status(404).json({ message: "Listing not found or unauthorized" });

    res.json({ message: "Listing deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Fetch open listings (filter support)
const getOpenListings = async (req, res) => {
  try {
    const { crop, location, minQty, maxQty } = req.query;
    const query = { status: "open" };

    if (crop) query.crop = crop;
    if (location) query.location = location;
    if (minQty) query.quantityKg = { ...query.quantityKg, $gte: Number(minQty) };
    if (maxQty) query.quantityKg = { ...query.quantityKg, $lte: Number(maxQty) };

    const listings = await Listing.find(query).populate("createdBy", "username fullName");

    res.json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch open listings" });
  }
};

// 🆕 FPO Approval controllers
const getPendingListings = async (req, res) => {
  try {
    const listings = await Listing.find({ status: "pending" })
      .populate("createdBy", "username fullName email");
    res.json({ listings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const approveListing = async (req, res) => {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: "open" },
      { new: true }
    );
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    res.json({ message: "Listing approved", listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const rejectListing = async (req, res) => {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    );
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    res.json({ message: "Listing rejected", listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createListing,
  getListings,
  getMyListings,
  getListingById,
  updateListing,
  deleteListing,
  getOpenListings,
  getPendingListings, 
  approveListing,     
  rejectListing       
};
