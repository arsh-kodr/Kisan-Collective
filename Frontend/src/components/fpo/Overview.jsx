// src/components/fpo/Overview.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, ListChecks, Package } from "lucide-react";
import statsApi from "../../api/statsApi";

const Overview = () => {
  const [stats, setStats] = useState({ listings: 0, lots: 0, bids: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await statsApi.getFpoStats();
        setStats(res.data || { listings: 0, lots: 0, bids: 0 });
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Total Listings", value: stats.listings, icon: <ListChecks /> },
    { label: "Open Lots", value: stats.lots, icon: <Package /> },
    { label: "Active Bids", value: stats.bids, icon: <BarChart3 /> },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {cards.map((card, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white p-6 rounded-xl shadow-md flex items-center justify-between"
        >
          <div>
            <h3 className="text-gray-500 text-sm">{card.label}</h3>
            <p className="text-2xl font-bold text-gray-800">{card.value}</p>
          </div>
          <div className="text-green-600">{card.icon}</div>
        </motion.div>
      ))}
    </div>
  );
};

export default Overview;
