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

    mandiPriceAtEntry: {
      type: Number,
      required: false,
      min: 0,
    },

    expectedPricePerKg: {
      type: Number,
      required: false,
      min: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    lot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lot",
      default: null,
      index: true,
    },

    status: {
      type: String,
      enum: ["pending", "open", "pooled", "sold", "cancelled"],
      default: "pending",
      index: true,
    },

    location: {
      type: String,
      required: false,
      trim: true,
    },

    photos: {
      type: [String],
      default: [],
    },

    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Indexes
listingSchema.index({ createdBy: 1, status: 1 });
listingSchema.index({ status: 1, crop: 1, location: 1 });

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
