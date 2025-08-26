// src/models/listing.model.js
const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    crop: {
      type: String,
      required: [true, "Crop name is required"],
      trim: true,
      index: true,
    },

    // quantity in kilograms (you can change unit if needed)
    quantityKg: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },

    unit: {
      type: String,
      default: "kg",
      enum: ["kg", "quintal", "tonne"],
    },

    harvestDate: {
      type: Date,
      required: [true, "Harvest date is required"],
    },

    // mandi price at time of entry (optional but useful)
    mandiPriceAtEntry: {
      type: Number,
      required: false,
      min: 0,
    },

    // optional expected price set by farmer
    expectedPricePerKg: {
      type: Number,
      required: false,
      min: 0,
    },

    // who created the listing (farmer)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // reference to a Lot if this listing is pooled into a lot
    lot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lot",
      default: null,
    },

    // listing status lifecycle: pending -> open -> pooled -> sold -> cancelled
    status: {
      type: String,
      enum: ["pending", "open", "pooled", "sold", "cancelled"],
      default: "pending",
      index: true,
    },

    // optional location (village / mandi name / coords)
    location: {
      type: String,
      required: false,
      trim: true,
    },

    // images / proofs — store S3/Cloudinary URLs
    photos: {
      type: [String],
      default: [],
    },

    // any extra metadata
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Example compound index for quick queries (by farmer + status)
listingSchema.index({ createdBy: 1, status: 1 });



const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
