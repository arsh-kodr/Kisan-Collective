// src/components/Navbar.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="font-bold text-xl text-green-700 hover:text-green-800 transition">
          KissanCollective
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/lots" className="text-sm text-gray-700 hover:text-green-600 transition">
            Browse Lots
          </Link>

          {user?.role === "farmer" && (
            <Link to="/farmer/listings" className="text-sm text-gray-700 hover:text-green-600 transition">
              My Listings
            </Link>
          )}

          {user?.role === "fpo" && (
            <Link to="/fpo/dashboard" className="text-sm text-gray-700 hover:text-green-600 transition">
              FPO Dashboard
            </Link>
          )}

          {user ? (
            <>
              <span className="text-sm font-medium text-gray-700">
                {user.username || user.fullName?.firstName || user.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-700 hover:text-green-600 transition">
                Login
              </Link>
              <Link to="/register" className="text-sm text-gray-700 hover:text-green-600 transition">
                Register
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-gray-700"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <Link
            to="/lots"
            onClick={() => setMobileOpen(false)}
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
          >
            Browse Lots
          </Link>

          {user?.role === "farmer" && (
            <Link
              to="/farmer/listings"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
            >
              My Listings
            </Link>
          )}

          {user?.role === "fpo" && (
            <Link
              to="/fpo/dashboard"
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
            >
              FPO Dashboard
            </Link>
          )}

          {user ? (
            <>
              <span className="block px-4 py-2 text-gray-700">{user.username || user.fullName?.firstName || user.email}</span>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-red-500 hover:bg-red-50 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-100 transition"
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
