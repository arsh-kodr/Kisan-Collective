import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Menu, X, ChevronDown } from "lucide-react";
import api from "../api/api";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadOrders, setUnreadOrders] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch buyer unread/pending orders
  useEffect(() => {
    if (user?.role === "buyer") {
      const fetchOrders = async () => {
        try {
          const res = await api.get("/orders/my-orders");
          const pendingOrders = res.data.orders.filter((o) => o.status === "pending").length;
          setUnreadOrders(pendingOrders);
        } catch (err) {
          console.error(err);
        }
      };
      fetchOrders();
    }
  }, [user]);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const linkClass = (path) =>
    `text-sm font-medium transition-colors duration-200 ${
      location.pathname === path ? "text-green-700" : "text-gray-700 hover:text-green-600"
    }`;

  return (
    <nav className="sticky top-0 z-50 bg-white shadow">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link
          to="/"
          className="font-bold text-xl text-green-700 hover:text-green-800 transition-transform duration-200 hover:scale-105"
        >
          KissanCollective
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/lots" className={linkClass("/lots")}>
            Browse Lots
          </Link>

          {user?.role === "buyer" && (
            <Link
              to="/buyer/dashboard"
              className={linkClass("/buyer/dashboard") + " relative flex items-center gap-1"}
            >
              Buyer Dashboard
              {unreadOrders > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center animate-pulse">
                  {unreadOrders}
                </span>
              )}
            </Link>
          )}

          {user?.role === "farmer" && (
            <Link to="/farmer/dashboard" className={linkClass("/farmer/dashboard")}>
              Farmer Dashboard
            </Link>
          )}

          {user?.role === "fpo" && (
            <Link to="/fpo/dashboard" className={linkClass("/fpo/dashboard")}>
              FPO Dashboard
            </Link>
          )}

          {/* User Dropdown */}
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
              >
                {user.username || user.fullName?.firstName || user.email}
                <motion.div
                  animate={{ rotate: dropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={16} />
                </motion.div>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50"
                  >
                    <button
                      onClick={() => {
                        navigate("/profile");
                        setDropdownOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors ${
                        location.pathname === "/profile" ? "bg-gray-100 font-semibold" : ""
                      }`}
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setDropdownOpen(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link to="/login" className={linkClass("/login")}>
                Login
              </Link>
              <Link to="/register" className={linkClass("/register")}>
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-gray-700 hover:text-green-700 transition-transform duration-200 hover:scale-110"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white shadow-lg animate-slide-down">
          <Link
            to="/lots"
            onClick={() => setMobileOpen(false)}
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Browse Lots
          </Link>

          {user?.role === "buyer" && (
            <Link
              to="/buyer/dashboard"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              Buyer Dashboard
              {unreadOrders > 0 && (
                <span className="bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center animate-pulse">
                  {unreadOrders}
                </span>
              )}
            </Link>
          )}

          {user?.role === "farmer" && (
            <Link
              to="/farmer/dashboard"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Farmer Dashboard
            </Link>
          )}

          {user?.role === "fpo" && (
            <Link
              to="/fpo/dashboard"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              FPO Dashboard
            </Link>
          )}

          {user ? (
            <>
              <span
                onClick={() => navigate("/profile")}
                className="block px-4 py-2 text-gray-700 cursor-pointer"
              >
                {user.username || user.fullName?.firstName || user.email}
              </span>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
