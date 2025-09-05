// src/pages/BuyerDashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../api/api"; // fixed path
import { motion } from "framer-motion";
import { Dialog } from "@headlessui/react";

// Helper to get status color
const statusColor = (status) => {
  switch (status) {
    case "pending":
      return "text-yellow-500";
    case "paid":
      return "text-blue-500";
    case "shipped":
      return "text-purple-500";
    case "delivered":
      return "text-green-600";
    case "cancelled":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
};

export default function BuyerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState(null);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get("/orders/my-orders");
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load orders.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const summary = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    paid: orders.filter((o) => o.status === "paid").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handlePaymentRetry = async (order) => {
    try {
      const res = await api.post("/payment/initiate", {
        lotId: order.lot._id,
        amount: order.amount / 100 || order.amount,
      });
      const { order: razorOrder } = res.data;

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: razorOrder.amount,
        currency: razorOrder.currency,
        order_id: razorOrder.id,
        handler: async function (response) {
          await api.post("/payment/verify", {
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          });
          alert("Payment Successful!");
          // Update order status without reload
          setOrders((prev) =>
            prev.map((o) =>
              o._id === order._id ? { ...o, status: "paid" } : o
            )
          );
          setModalOpen(false);
        },
        prefill: {
          name: user.fullName?.firstName || user.username,
          email: user.email,
        },
        theme: { color: "#16a34a" },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      console.error(err);
      alert("Payment initiation failed.");
    }
  };

  const handleDownloadReceipt = (order) => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(order, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `order_${order._id}.json`);
    dlAnchor.click();
  };

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-3xl font-bold text-green-700">
        Welcome, {user.fullName?.firstName || user.username}!
      </h1>

      {error && <p className="text-red-600">{error}</p>}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(summary).map(([key, value]) => (
          <motion.div
            key={key}
            className="bg-white shadow-md rounded-lg p-4 flex flex-col items-center hover:shadow-xl transition-shadow duration-300"
            whileHover={{ scale: 1.03 }}
          >
            <span className="text-gray-500 capitalize">{key}</span>
            <span
              className={`text-xl font-bold ${
                key === "pending"
                  ? "text-yellow-500"
                  : key === "paid"
                  ? "text-blue-500"
                  : key === "shipped"
                  ? "text-purple-500"
                  : key === "delivered"
                  ? "text-green-600"
                  : key === "cancelled"
                  ? "text-red-500"
                  : "text-gray-700"
              }`}
            >
              {value}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mt-4">
        {["all", "pending", "paid", "shipped", "delivered", "cancelled"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full font-medium transition-colors duration-200 ${
                filter === status
                  ? "bg-green-700 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-green-100"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          )
        )}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-gray-500 mt-4">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-gray-500 mt-4">No orders found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {filteredOrders.map((order) => (
            <motion.div
              key={order._id}
              className="bg-white shadow-md rounded-lg p-4 hover:shadow-xl transition-shadow duration-300 border-l-4 border-green-700 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              onClick={() => handleOrderClick(order)}
            >
              <h2 className="text-lg font-semibold text-gray-800">
                {order.lot?.name}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                FPO: {order.fpo?.username}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Amount: ₹{(order.amount / 100 || order.amount).toLocaleString()}
              </p>
              <p className="mt-2 font-medium">
                Status:{" "}
                <span className={`capitalize ${statusColor(order.status)}`}>
                  {order.status}
                </span>
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        className="fixed z-50 inset-0 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen p-4">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          {selectedOrder && (
            <motion.div
              className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <Dialog.Title className="text-xl font-bold text-gray-800">
                {selectedOrder.lot?.name}
              </Dialog.Title>
              <p className="mt-2 text-gray-500">
                FPO: {selectedOrder.fpo?.username}
              </p>
              <p className="text-gray-500 mt-1">
                Amount: ₹
                {(selectedOrder.amount / 100 || selectedOrder.amount).toLocaleString()}
              </p>
              <p className="mt-2 font-medium">
                Status:{" "}
                <span className={`capitalize ${statusColor(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </p>
              {selectedOrder.shippingAddress?.address && (
                <p className="text-gray-500 mt-2">
                  Address: {selectedOrder.shippingAddress.address},{" "}
                  {selectedOrder.shippingAddress.city},{" "}
                  {selectedOrder.shippingAddress.state} -{" "}
                  {selectedOrder.shippingAddress.pincode}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedOrder.status === "pending" && (
                  <button
                    onClick={() => handlePaymentRetry(selectedOrder)}
                    className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition"
                  >
                    Retry Payment
                  </button>
                )}
                {selectedOrder.status === "paid" && (
                  <button
                    onClick={() => handleDownloadReceipt(selectedOrder)}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                  >
                    Download Receipt
                  </button>
                )}
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </Dialog>
    </div>
  );
}
