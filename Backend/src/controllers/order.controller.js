const Order = require("../models/order.model");
const Lot = require("../models/lot.model");
const Bid = require("../models/bid.model");
const Transaction = require("../models/transaction.model");

// Create Order (called after successful payment or manually by buyer)
const createOrder = async (req, res) => {
  try {
    const { lotId, transactionId, shippingAddress } = req.body;

    const lot = await Lot.findById(lotId).populate("winningBid");
    if (!lot) return res.status(404).json({ message: "Lot not found" });
    if (!lot.winningBid) return res.status(400).json({ message: "No winning bid for this lot" });

    const bid = await Bid.findById(lot.winningBid);
    if (!bid) return res.status(404).json({ message: "Winning bid not found" });

    // Ensure only winning buyer can create order
    if (String(bid.bidder) !== req.user.sub) {
      return res.status(403).json({ message: "Only winning bidder can create this order" });
    }

    // Check transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    // Prevent duplicate order
    let existing = await Order.findOne({ transaction: transaction._id });
    if (existing) {
      return res.json({ message: "Order already exists", order: existing });
    }

    const order = await Order.create({
      lot: lot._id,
      buyer: bid.bidder,
      fpo: lot.fpo,
      bid: bid._id,
      amount: bid.amount,
      transaction: transaction._id,
      shippingAddress: shippingAddress || {},
      paymentStatus: transaction.status === "succeeded" ? "paid" : "pending",
      status: transaction.status === "succeeded" ? "processing" : "pending",
    });

    res.status(201).json({ message: "Order created successfully", order });
  } catch (err) {
    console.error("createOrder error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// Get my orders (buyer)
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.sub })
      .populate("lot", "name status")
      .populate("fpo", "username email")
      .populate("transaction", "status amountPaise")
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (err) {
    console.error("getMyOrders error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// Get orders for FPO
const getFpoOrders = async (req, res) => {
  try {
    const orders = await Order.find({ fpo: req.user.sub })
      .populate("lot", "name status")
      .populate("buyer", "username email")
      .populate("transaction", "status amountPaise")
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (err) {
    console.error("getFpoOrders error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// Update order status (FPO/Admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (req.user.role !== "admin" && String(order.fpo) !== req.user.sub) {
      return res.status(403).json({ message: "Forbidden" });
    }

    order.status = status;
    await order.save();

    res.json({ message: "Order updated successfully", order });
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = { createOrder, getMyOrders, getFpoOrders, updateOrderStatus };
