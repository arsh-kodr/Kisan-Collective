// src/pages/MyOrders.jsx
import { useEffect, useState, useMemo } from "react";
import api from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import PayNowButton from "../components/PayNowButton";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-200 text-green-900",
  cancelled: "bg-red-100 text-red-800",
  failed: "bg-red-200 text-red-900",
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("dateDesc");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/payments/my-transactions", {
        withCredentials: true,
      });
      setOrders(res.data.transactions || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Dashboard Summary
  const summary = useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === "pending").length;
    const paidOrders = orders.filter((o) => o.status === "paid" || o.status === "succeeded").length;
    const totalAmount = orders.reduce((sum, o) => sum + (o.amountPaise / 100), 0);

    return { totalOrders, pendingOrders, paidOrders, totalAmount };
  }, [orders]);

  // Filter, search, sort logic
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    if (filterStatus !== "all") filtered = filtered.filter((o) => o.status === filterStatus);

    if (searchTerm.trim() !== "")
      filtered = filtered.filter((o) =>
        o.lot?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    if (sortBy === "dateAsc") filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    else if (sortBy === "dateDesc") filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    else if (sortBy === "amountAsc") filtered.sort((a, b) => a.amountPaise - b.amountPaise);
    else if (sortBy === "amountDesc") filtered.sort((a, b) => b.amountPaise - a.amountPaise);

    return filtered;
  }, [orders, filterStatus, searchTerm, sortBy]);

  if (loading)
    return (
      <div className="text-center text-gray-500 animate-pulse mt-6">
        Loading your orders...
      </div>
    );

  if (orders.length === 0)
    return (
      <div className="text-center text-gray-600 p-6 bg-white rounded-xl shadow mt-6">
        You have no orders yet.
      </div>
    );

  return (
    <div className="space-y-6 mt-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">My Orders</h2>

      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Orders", value: summary.totalOrders, color: "bg-green-100 text-green-800" },
          { label: "Pending Orders", value: summary.pendingOrders, color: "bg-yellow-100 text-yellow-800" },
          { label: "Paid Orders", value: summary.paidOrders, color: "bg-blue-100 text-blue-800" },
          { label: "Total Amount Spent", value: `₹${summary.totalAmount.toFixed(0)}`, color: "bg-indigo-100 text-indigo-800" },
        ].map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.03, boxShadow: "0 10px 25px rgba(0,0,0,0.12)" }}
            className={`p-4 rounded-2xl shadow ${card.color} flex flex-col items-start transition-all`}
          >
            <span className="text-sm font-medium">{card.label}</span>
            <span className="mt-2 text-xl font-bold">{card.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "paid", "processing", "shipped", "delivered", "cancelled", "failed"].map((status) => (
            <button
              key={status}
              className={`px-3 py-1 rounded-full text-sm font-medium capitalize transition
                ${filterStatus === status ? "bg-green-600 text-white shadow" : "bg-gray-100 text-gray-800 hover:bg-gray-200"}`}
              onClick={() => setFilterStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap sm:flex-row flex-col items-start sm:items-center">
          <input
            type="text"
            placeholder="Search by lot..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
          >
            <option value="dateDesc">Newest First</option>
            <option value="dateAsc">Oldest First</option>
            <option value="amountDesc">Amount High → Low</option>
            <option value="amountAsc">Amount Low → High</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <AnimatePresence>
        {filteredOrders.map((tx) => {
          const lot = tx.lot;
          const amount = (tx.amountPaise / 100).toFixed(0);
          const isPaid = tx.status === "succeeded" || tx.status === "paid";

          return (
            <motion.div
              key={tx._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              whileHover={{ scale: 1.02, boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}
              className="bg-white rounded-2xl shadow p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center transition-all duration-300"
            >
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-800 mb-1">{lot?.name || "Unknown Lot"}</h3>
                <p className="text-sm text-gray-500 mb-1">Lot ID: {lot?._id.slice(-6)}</p>
                <p className="text-sm text-gray-600">
                  Amount: <span className="font-semibold">₹{amount}</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4 sm:mt-0">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${STATUS_COLORS[tx.status] || "bg-gray-100 text-gray-800"}`}
                >
                  {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                </span>

                {!isPaid && (
                  <PayNowButton
                    lotId={lot._id}
                    amount={amount}
                    onPaymentSuccess={() => {
                      toast.success("✅ Payment successful!");
                      fetchOrders();
                    }}
                  />
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {filteredOrders.length === 0 && (
        <div className="text-center text-gray-500 p-6 bg-white rounded-xl shadow">
          No orders match your filter/search criteria.
        </div>
      )}
    </div>
  );
}
