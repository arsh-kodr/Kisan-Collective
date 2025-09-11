const Listing = require("../models/listing.model");
const Lot = require("../models/lot.model");
const User = require("../models/user.model");
const mongoose = require("mongoose");

// Farmer creates new listing (default = pending)
const createListing = async (req, res) => {
  try {
    const {
      crop,
      quantityKg,
      unit = "kg",
      harvestDate,
      mandiPriceAtEntry,
      expectedPricePerKg,
      location,
      photos,
    } = req.body;

    if (!crop || !quantityKg || !harvestDate || !expectedPricePerKg) {
      return res.status(400).json({
        message: "Crop, quantity, harvest date, and expected price per kg are required",
      });
    }

    const quantity = Number(quantityKg);
    const pricePerKg = Number(expectedPricePerKg);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive number" });
    }
    if (!Number.isFinite(pricePerKg) || pricePerKg <= 0) {
      return res.status(400).json({ message: "Expected price per kg must be positive" });
    }

    const harvest = new Date(harvestDate);
    const today = new Date();
    if (harvest > today) {
      return res
        .status(400)
        .json({ message: "Harvest date must not be later than today" });
    }

    const basePrice = quantity * pricePerKg;

    const listingData = {
      crop,
      quantityKg: quantity,
      unit,
      harvestDate: harvest,
      mandiPriceAtEntry: mandiPriceAtEntry ? Number(mandiPriceAtEntry) : undefined,
      expectedPricePerKg: pricePerKg,
      basePrice,
      location,
      photos: photos || [],
      createdBy: req.user.sub,
      status: "pending", // FPO must approve before it becomes open
    };

    const listing = await Listing.create(listingData);

    res.status(201).json({ message: "Listing submitted for FPO approval", listing });
  } catch (err) {
    console.error("createListing error:", err);
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
    const id = req.params.id;

    // Defensive: ensure id is a valid ObjectId to avoid CastError
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid listing id" });
    }

    const listing = await Listing.findById(id)
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

// Get all listings of a specific farmer (FPO use case)
const getFarmerListings = async (req, res) => {
  try {
    const farmerId = req.params.id;

    const listings = await Listing.find({ createdBy: farmerId })
      .populate("createdBy", "username fullName email")
      .populate("lot", "name status");

    res.json({ listings });
  } catch (err) {
    console.error("Error fetching farmer listings:", err);
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
  rejectListing,
  getFarmerListings    
};
