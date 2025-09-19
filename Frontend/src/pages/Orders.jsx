// src/pages/Orders.jsx
import React, { useEffect, useState } from "react";
import api from "../api/api";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  payment_failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/orders/my-orders");
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error("Failed to load orders:", err);
      }
    };
    load();
  }, []);

  if (!orders.length) {
    return (
      <div className="p-6 text-center text-gray-600">
        <h2 className="text-xl font-semibold">My Orders</h2>
        <p className="mt-2">No orders found yet.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">My Orders</h2>
      <div className="grid gap-4 md:grid-cols-2">
        {orders.map((o) => (
          <div
            key={o._id}
            onClick={() => setSelectedOrder(o)}
            className="bg-white rounded-xl shadow-md p-4 border hover:shadow-lg transition cursor-pointer"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-lg">
                Lot: {o.lot?.name || "Unnamed Lot"}
              </h3>
              <span
                className={`px-2 py-1 rounded-full text-sm font-medium ${
                  statusColors[o.status] || "bg-gray-100 text-gray-800"
                }`}
              >
                {o.status}
              </span>
            </div>
            <p className="text-gray-700">
              <span className="font-medium">Amount:</span> ₹{o.amount}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Payment:</span>{" "}
              {o.paymentStatus === "paid" ? "✅ Paid" : "❌ Not Paid"}
            </p>
          </div>
        ))}
      </div>

      {/* Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-lg p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
              onClick={() => setSelectedOrder(null)}
            >
              ✕
            </button>

            <h3 className="text-xl font-bold mb-2">
              Lot: {selectedOrder.lot?.name || "Unnamed Lot"}
            </h3>
            <p className="text-gray-700 mb-1">
              <span className="font-medium">Amount:</span> ₹{selectedOrder.amount}
            </p>
            <p className="text-gray-700 mb-1">
              <span className="font-medium">Payment:</span>{" "}
              {selectedOrder.paymentStatus === "paid" ? "✅ Paid" : "❌ Not Paid"}
            </p>
            <p className="text-gray-700 mb-1">
              <span className="font-medium">Status:</span>{" "}
              <span
                className={`px-2 py-1 rounded-full text-sm font-medium ${
                  statusColors[selectedOrder.status] || "bg-gray-100 text-gray-800"
                }`}
              >
                {selectedOrder.status}
              </span>
            </p>

            {selectedOrder.transaction && (
              <p className="text-gray-500 text-sm mb-1">
                Transaction ID: {selectedOrder.transaction}
              </p>
            )}

            <p className="text-gray-400 text-xs mb-3">
              Ordered on:{" "}
              {new Date(selectedOrder.createdAt).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>

            {/* Extra lot info */}
            {selectedOrder.lot && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                <h4 className="font-semibold mb-1">Lot Details</h4>
                <p className="text-sm text-gray-600">
                  Crop: {selectedOrder.lot.crop || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  Quantity: {selectedOrder.lot.quantity || "N/A"}
                </p>
                <p className="text-sm text-gray-600">
                  Base Price: ₹{selectedOrder.lot.basePrice || "N/A"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
