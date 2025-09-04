// src/components/fpo/Sidebar.jsx
import React from "react";
import { motion } from "framer-motion";
import { BarChart3, ListChecks, Package, LogOut, X } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

const Sidebar = ({ activeTab, setActiveTab, onClose }) => {
  const { logout } = useAuth();
  const items = [
    { key: "overview", label: "Overview", icon: <BarChart3 size={18} /> },
    { key: "listings", label: "Listings", icon: <ListChecks size={18} /> },
    { key: "lots", label: "Lots", icon: <Package size={18} /> },
  ];

  return (
    <aside className="w-64 bg-white shadow-xl flex flex-col h-screen sticky top-0 z-50">
      <div className="p-6 border-b flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-green-600">KissanCollective</h2>
          <p className="text-xs text-gray-500">FPO Dashboard</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-gray-600">
            <X size={20} />
          </button>
        )}
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {items.map(({ key, label, icon }) => (
          <motion.button
            key={key}
            onClick={() => { setActiveTab(key); if (onClose) onClose(); }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition-all
              ${activeTab === key ? "bg-green-600 text-white shadow-md" : "text-gray-700 hover:bg-gray-100"}`}
          >
            {icon}
            {label}
          </motion.button>
        ))}
      </nav>
      <div className="p-4 border-t">
        <motion.button
          onClick={logout}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <LogOut size={18} />
          Logout
        </motion.button>
      </div>
    </aside>
  );
};

export default Sidebar;
