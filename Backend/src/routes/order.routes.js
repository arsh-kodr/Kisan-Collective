const express = require("express");
const { authenticate, authorize } = require("../middleware/auth.middleware");
const {
  createOrder,
  getMyOrders,
  getFpoOrders,
  updateOrderStatus,
} = require("../controllers/order.controller");

const router = express.Router();

// Buyer creates order (after winning auction)
router.post("/create", authenticate, authorize("buyer"), createOrder);

// Buyer views their orders
router.get("/my-orders", authenticate, authorize("buyer"), getMyOrders);

// FPO views orders for their lots
router.get("/fpo-orders", authenticate, authorize("fpo"), getFpoOrders);

// FPO/Admin updates order status
router.patch("/:orderId/status", authenticate, updateOrderStatus);

module.exports = router;
