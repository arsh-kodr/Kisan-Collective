const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    lot: { type: mongoose.Schema.Types.ObjectId, ref: "Lot", required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fpo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    bid: { type: mongoose.Schema.Types.ObjectId, ref: "Bid", required: true },
    amount: { type: Number, required: true },

    // 🔗 Link to transaction
    transaction: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },

    shippingAddress: {
      address: String,
      city: String,
      state: String,
      pincode: String,
    },

    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
