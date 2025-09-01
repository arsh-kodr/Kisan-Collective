const Order = require("../models/order.model");
const Lot = require("../models/lot.model");
const Bid = require("../models/bid.model");
const { Model, model } = require("mongoose");

// Create Order (called after auction close)
const createOrder = async (req, res) => {
  try {
    const { lotId, shippingAddress } = req.body;

    const lot = await Lot.findById(lotId).populate("winningBid");
    if (!lot) return res.status(404).json({ message: "Lot not found" });
    if (!lot.winningBid) return res.status(400).json({ message: "No winning bid for this lot" });

    const bid = await Bid.findById(lot.winningBid);
    if (!bid) return res.status(404).json({ message: "Winning bid not found" });

    // Ensure only the winning buyer can create order
    if (String(bid.bidder) !== req.user.sub) {
      return res.status(403).json({ message: "Only winning bidder can create this order" });
    }

    const order = await Order.create({
      lot: lot._id,
      buyer: bid.bidder,
      fpo: lot.fpo,
      bid: bid._id,
      amount: bid.amount,
      shippingAddress: shippingAddress || {},
      status: "pending", // default status
    });

    res.status(201).json({ message: "Order created successfully", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get my orders (buyer)
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.sub })
      .populate("lot", "name status")
      .populate("fpo", "username email")
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get orders for FPO (their lots)
const getFpoOrders = async (req, res) => {
  try {
    const orders = await Order.find({ fpo: req.user.sub })
      .populate("lot", "name status")
      .populate("buyer", "username email")
      .sort({ createdAt: -1 });

    res.json({ orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update order status (FPO/Admin) - e.g., shipped/delivered
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "paid", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (req.user.role !== "admin" && String(order.fpo) !== req.user.sub) {
      return res.status(403).json({ message: "Forbidden" });
    }

    order.status = status;
    await order.save();

    res.json({ message: "Order updated successfully", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { createOrder, getMyOrders, getFpoOrders, updateOrderStatus };


