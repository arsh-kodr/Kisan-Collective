// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import api from "../api/api";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [myLots, setMyLots] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setLoadingData(true);
      try {
        if (user.role === "fpo") {
          const res = await api.get("/lots/me/lots");
          setMyLots(res.data.lots || []);
        } else if (user.role === "buyer") {
          const res = await api.get("/orders/my-orders");
          setOrders(res.data.orders || []);
        }
        setError(null);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load dashboard data");
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [user]);

  if (loading || loadingData) return <div className="p-4 text-gray-600">Loading dashboard...</div>;

  if (!user) return <div className="p-4 text-red-600">User not found. Please login.</div>;

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">
        Welcome, {user.username || user.fullName?.firstName || user.email}!
      </h2>

      {/* Buyer Dashboard */}
      {user.role === "buyer" && (
        <section>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">My Orders</h3>
          {orders.length === 0 ? (
            <p className="text-gray-600">You have no orders yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((o) => (
                <motion.div
                  key={o._id}
                  whileHover={{ scale: 1.03 }}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
                >
                  <h4 className="font-semibold text-gray-800">{o.lot.name}</h4>
                  <p>
                    Status:{" "}
                    <span
                      className={`font-medium ${
                        o.status === "pending"
                          ? "text-yellow-500"
                          : o.status === "paid"
                          ? "text-green-600"
                          : "text-gray-600"
                      }`}
                    >
                      {o.status}
                    </span>
                  </p>
                  <p>Amount: ₹{o.amount}</p>
                  <Link
                    to={`/lots/${o.lot._id}`}
                    className="text-green-700 hover:text-green-900 text-sm mt-2 inline-block"
                  >
                    View Lot
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* FPO Dashboard */}
      {user.role === "fpo" && (
        <section>
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Your Lots</h3>
          {myLots.length === 0 ? (
            <p className="text-gray-600">No lots created yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myLots.map((l) => (
                <motion.div
                  key={l._id}
                  whileHover={{ scale: 1.03 }}
                  className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
                >
                  <h4 className="font-semibold text-gray-800">{l.name}</h4>
                  <p>Status: 
                    <span
                      className={`ml-1 font-medium ${
                        l.status === "open"
                          ? "text-green-600"
                          : l.status === "closed"
                          ? "text-gray-500"
                          : "text-yellow-500"
                      }`}
                    >
                      {l.status}
                    </span>
                  </p>
                  <Link
                    to={`/lots/${l._id}`}
                    className="text-green-700 hover:text-green-900 text-sm mt-2 inline-block"
                  >
                    View Lot
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Farmer Dashboard */}
      {user.role === "farmer" && (
        <section className="text-gray-700">
          <h3 className="text-xl font-semibold mb-2">Farmer Dashboard</h3>
          <p>Farmers dashboard coming soon...</p>
          <Link
            to="/farmer/listings"
            className="text-green-700 hover:text-green-900 text-sm mt-2 inline-block"
          >
            View My Listings
          </Link>
        </section>
      )}

      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  );
}
