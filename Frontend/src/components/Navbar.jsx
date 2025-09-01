import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar(){
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div>
          <Link to="/" className="font-bold text-xl">KissanCollective</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/lots" className="text-sm">Lots</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="text-sm">{user.username || user.email}</Link>
              <button
                className="text-sm bg-red-500 text-white px-3 py-1 rounded"
                onClick={() => { logout(); nav("/"); }}
              >Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm">Login</Link>
              <Link to="/register" className="text-sm">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
