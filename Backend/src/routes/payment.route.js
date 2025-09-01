// src/routes/payment.route.js
const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middleware/auth.middleware");
const {
  initiatePayment,
  verifyPayment,
  webhookHandler,
} = require("../controllers/payment.controller");

// initiate payment (buyer)
router.post("/initiate", authenticate, authorize("buyer"), initiatePayment);

// verify after checkout (buyer)
router.post("/verify", authenticate, authorize("buyer"), verifyPayment);

// list buyer transactions
router.get("/my-transactions", authenticate, authorize("buyer"), async (req, res) => {
  const Transaction = require("../models/transaction.model");
  const txs = await Transaction.find({ buyer: req.user.sub })
    .sort({ createdAt: -1 })
    .populate("lot bid");
  res.json({ transactions: txs });
});

// FPO/admin can see payments for a lot
router.get("/lot/:lotId", authenticate, authorize(["fpo", "admin"]), async (req, res) => {
  const Transaction = require("../models/transaction.model");
  const { lotId } = req.params;
  const txs = await Transaction.find({ lot: lotId })
    .sort({ createdAt: -1 })
    .populate("buyer bid");
  res.json({ payments: txs });
});

// Razorpay webhook (⚠️ needs raw body parsing, not JSON)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }), // raw body required
  webhookHandler
);

module.exports = router;
