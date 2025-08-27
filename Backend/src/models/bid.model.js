const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema(
  {
    lot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lot",
      required: true,
      index: true,
    },
    bidder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [1, "Bid amount must be >= 1"],
      index: true,
    },
    // optional: keep snapshot of highest-at-time or metadata
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// single lot can have many bids from same user, but you may enforce monotonic increase per user in controller
bidSchema.index({ lot: 1, bidder: 1, createdAt: -1 });

const Bid = mongoose.model("Bid", bidSchema);
module.exports = Bid;
