// src/controllers/listing.controller.js
const Listing = require("../models/listing.model");
const Lot = require("../models/lot.model");
const User = require("../models/user.model");


const createListing = async (req, res) => {
  try {
    const { crop, quantityKg, unit, harvestDate, mandiPriceAtEntry, expectedPricePerKg, location, photos } = req.body;

    // Required fields validation
    if (!crop || !quantityKg || !harvestDate) {
      return res.status(400).json({ message: "Crop, quantity, and harvest date are required" });
    }

    // Build listing object (only allowed fields)
    const listingData = {
      crop,
      quantityKg,
      harvestDate,
      createdBy: req.user.sub,
      status: "open",
    };

    // Optional fields
    if (unit) listingData.unit = unit;
    if (mandiPriceAtEntry) listingData.mandiPriceAtEntry = mandiPriceAtEntry;
    if (expectedPricePerKg) listingData.expectedPricePerKg = expectedPricePerKg;
    if (location) listingData.location = location;
    if (photos) listingData.photos = photos;

    const listing = await Listing.create(listingData);

    res.status(201).json({ message: "Listing created successfully", listing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


//  Get all listings (public or FPO)
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

//  Get listings by authenticated farmer
const getMyListings = async (req, res) => {
  try {
    const listings = await Listing.find({ createdBy: req.user.sub }).populate("lot", "name status");
    res.json({ listings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//  Get single listing by ID
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

//  Update listing (Farmer only)
const updateListing = async (req, res) => {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, createdBy: req.user.sub });
    if (!listing) return res.status(404).json({ message: "Listing not found or unauthorized" });

    const allowedFields = ["crop", "quantityKg", "unit", "harvestDate", "mandiPriceAtEntry", "expectedPricePerKg", "location", "photos", "status"];
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

//  Delete listing (Farmer only)
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

module.exports = {
  createListing,
  getListings,
  getMyListings,
  getListingById,
  updateListing,
  deleteListing,
};
