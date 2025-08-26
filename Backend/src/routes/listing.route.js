// src/routes/listing.route.js
const express = require("express");
const {
  createListing,
  getListings,
  getMyListings,
  getListingById,
  updateListing,
  deleteListing,
} = require("../controllers/listing.controller");

const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

//  Public / FPO view
router.get("/", authenticate, getListings); // FPO or any logged-in user
router.get("/:id", authenticate, getListingById);

//  Farmer only
router.get("/me/listings", authenticate, authorize("farmer"), getMyListings);
router.post("/", authenticate, authorize("farmer"), createListing);
router.put("/:id", authenticate, authorize("farmer"), updateListing);
router.delete("/:id", authenticate, authorize("farmer"), deleteListing);

module.exports = router;
