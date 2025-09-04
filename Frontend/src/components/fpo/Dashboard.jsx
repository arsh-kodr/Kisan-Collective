// src/components/fpo/Dashboard.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./Sidebar";
import Header from "./Header";
import Overview from "./Overview";
import Listings from "./Listings";
import Lots from "./Lots";

const FpoDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case "listings":
        return <Listings />;
      case "lots":
        return <Lots />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 transition-colors duration-300">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "tween" }}
            className="fixed inset-0 z-40 flex"
          >
            <div className="relative flex w-64">
              <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onClose={() => setSidebarOpen(false)}
              />
            </div>
            <div
              className="fixed inset-0 bg-black bg-opacity-40"
              onClick={() => setSidebarOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header with hamburger menu */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <motion.main
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          className="p-6 space-y-6"
        >
          {renderContent()}
        </motion.main>
      </div>
    </div>
  );
};

export default FpoDashboard;
