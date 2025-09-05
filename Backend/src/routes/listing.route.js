// src/routes/listing.route.js
const express = require("express");
const { authenticate, optionalAuthenticate, authorize } = require("../middleware/auth.middleware");
const {
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
} = require("../controllers/listing.controller");

const router = express.Router();

// Public / general
router.get("/", optionalAuthenticate, getListings); // list (open or filtered)
router.get("/open", optionalAuthenticate, getOpenListings);

// FPO-only / admin-style
router.get("/pending", authenticate, authorize("fpo"), getPendingListings);
router.get("/farmer/:id", authenticate, authorize("fpo"), getFarmerListings);

// Farmer-specific
router.get("/me/listings", authenticate, authorize("farmer"), getMyListings);

// FPO actions on individual listing (approve/reject)
router.put("/:id/approve", authenticate, authorize("fpo"), approveListing);
router.put("/:id/reject", authenticate, authorize("fpo"), rejectListing);

// Farmer CRUD (must be before :id to avoid conflicts with other specific endpoints)
router.post("/", authenticate, authorize("farmer"), createListing);
router.put("/:id", authenticate, authorize("farmer"), updateListing);
router.delete("/:id", authenticate, authorize("farmer"), deleteListing);

// NOTE: :id route MUST be last - it is a catch-all for listing identifiers
router.get("/:id", optionalAuthenticate, getListingById);

module.exports = router;
