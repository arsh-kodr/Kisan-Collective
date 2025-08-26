const mongoose = require("mongoose");

const lotSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    fpo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // FPO owner
    listings: [{ type: mongoose.Schema.Types.ObjectId, ref: "Listing" }], // pooled listings
    totalQuantity: { type: Number, default: 0 },
    status: { type: String, enum: ["open", "sold", "closed"], default: "open" },
  },
  { timestamps: true }
);

const Lot = mongoose.model("Lot", lotSchema);
module.exports = Lot;
    