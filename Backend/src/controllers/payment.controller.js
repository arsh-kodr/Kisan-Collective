// src/controllers/payment.controller.js
const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");

const Transaction = require("../models/transaction.model");
const Lot = require("../models/lot.model");
const Bid = require("../models/bid.model");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Buyer starts payment
const initiatePayment = async (req, res) => {
  try {
    const { lotId } = req.body; // we ignore client 'amount' for security
    if (!lotId) return res.status(400).json({ message: "lotId required" });
    if (!mongoose.Types.ObjectId.isValid(lotId)) {
      return res.status(400).json({ message: "Invalid lotId" });
    }

    // 1) Find lot; must be sold with a winningBid set
    const lot = await Lot.findById(lotId).populate({
      path: "winningBid",
      populate: { path: "bidder", select: "username email" },
    });
    if (!lot) return res.status(404).json({ message: "Lot not found" });

    if (lot.status !== "sold" || !lot.winningBid) {
      return res.status(400).json({ message: "Auction not closed or no winner yet" });
    }

    // 2) Only the winning buyer can pay
    if (String(lot.winningBid.bidder) !== req.user.sub) {
      return res.status(403).json({ message: "Only the winning buyer can pay for this lot" });
    }

    // 3) Prevent double payments
    const existingSuccess = await Transaction.findOne({
      lot: lot._id,
      buyer: req.user.sub,
      status: "succeeded",
    });
    if (existingSuccess) {
      return res.status(409).json({ message: "Payment already completed for this lot" });
    }

    // 4) Amount is derived from winning bid
    //    Bids in your system are rupees; Razorpay needs paise
    const amountPaise = Math.round(lot.winningBid.amount * 100);
    const currency = process.env.PAYMENT_CURRENCY || "INR";

    // 5) Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency,
      receipt: `lot_${lotId}_${Date.now()}`,
    });

    // 6) Persist transaction (pending)
    const tx = await Transaction.create({
      lot: lot._id,
      bid: lot.winningBid._id,
      buyer: req.user.sub,
      amountPaise,
      currency,
      providerOrderId: order.id,
      providerPaymentMeta: order,
      status: "pending",
    });

    return res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      order,              // contains id, amount, currency, etc.
      transactionId: tx._id,
    });
  } catch (err) {
    console.error("initiatePayment error:", err);
    return res.status(500).json({ message: "Could not initiate payment" });
  }
};

// Verify Razorpay signature after checkout
const verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ message: "orderId, paymentId, signature required" });
    }

    // Find the pending transaction for this buyer + order
    const tx = await Transaction.findOne({
      providerOrderId: orderId,
      buyer: req.user.sub,
      status: "pending",
    });

    if (!tx) {
      return res.status(404).json({ success: false, message: "Pending transaction not found" });
    }

    // Compute signature: order_id + "|" + payment_id
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // Mark success (idempotent guard)
    tx.providerPaymentId = paymentId;
    tx.providerSignature = signature;
    tx.status = "succeeded";
    await tx.save();

    return res.json({ success: true, message: "Payment verified", transaction: tx });
  } catch (err) {
    console.error("verifyPayment error:", err);
    return res.status(500).json({ message: "Verification failed" });
  }
};

// (optional) Webhook placeholder – wire later with express.raw + signature check
const webhookHandler = async (req, res) => {
  try {
    console.log("Webhook event:", req.body);
    return res.status(200).json({ received: true });
  } catch (err) {
    return res.status(500).json({ message: "Webhook error" });
  }
};

module.exports = { initiatePayment, verifyPayment, webhookHandler };
