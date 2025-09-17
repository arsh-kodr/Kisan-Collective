const mongoose = require("mongoose");

const lotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    fpo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    listings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Listing" }],
    totalQuantity: { type: Number, default: 0 }, // normalized to kg
    // base price for the whole lot (price per kg)
    basePrice: { type: Number, default: 0 },
    // Auction end time (optional)
    endTime: { type: Date, required: false },
    status: {
      type: String,
      enum: ["open", "sold", "closed"],
      default: "open",
    },
    winningBid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bid",
      default: null,
    },
  },
  { timestamps: true }
);

const Lot = mongoose.model("Lot", lotSchema);
module.exports = Lot;
