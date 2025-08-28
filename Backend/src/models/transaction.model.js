// src/models/transaction.model.js
const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    lot: { type: mongoose.Schema.Types.ObjectId, ref: "Lot", required: true, index: true },
    bid: { type: mongoose.Schema.Types.ObjectId, ref: "Bid" },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // Canonical unit in DB = paise (integer)
    amountPaise: { type: Number, required: true, min: 1 },
    currency: { type: String, default: process.env.PAYMENT_CURRENCY || "INR" },

    provider: { type: String, default: process.env.PAYMENT_PROVIDER || "razorpay" },

    // Razorpay identifiers
    providerOrderId: { type: String, required: true, index: true, unique: true }, // order_XYZ
    providerPaymentId: { type: String, default: null }, // pay_ABC after success
    providerSignature: { type: String, default: null },

    providerPaymentMeta: { type: mongoose.Schema.Types.Mixed, default: {} },

    // pending -> succeeded -> failed -> refunded
    status: {
      type: String,
      enum: ["pending", "succeeded", "failed", "refunded"],
      default: "pending",
      index: true,
    },

    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

transactionSchema.index({ lot: 1, buyer: 1 }); // quick lookups

module.exports = mongoose.model("Transaction", transactionSchema);
