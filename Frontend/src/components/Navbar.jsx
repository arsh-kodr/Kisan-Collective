// src/components/Navbar.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <div>
          <Link to="/" className="font-bold text-xl text-green-700 hover:text-green-800 transition">
            KissanCollective
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center gap-4">
          <Link to="/lots" className="text-sm hover:text-green-600 transition">
            Lots
          </Link>

          {/* Show Farmer-only nav link */}
          {user?.role === "farmer" && (
            <Link
              to="/farmer/listings"
              className="text-sm hover:text-green-600 transition"
            >
              My Listings
            </Link>
          )}

          {user ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm font-medium text-gray-700 hover:text-green-600 transition"
              >
                {user.username || user.email}
              </Link>
              <button
                className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                onClick={() => {
                  logout();
                  nav("/");
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm hover:text-green-600 transition">
                Login
              </Link>
              <Link to="/register" className="text-sm hover:text-green-600 transition">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
