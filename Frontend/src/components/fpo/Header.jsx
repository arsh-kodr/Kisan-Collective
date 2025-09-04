// src/components/fpo/Header.jsx
import React from "react";
import { Menu, UserCircle } from "lucide-react";

const Header = ({ onMenuClick }) => {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <header className="bg-white shadow px-6 py-4 flex justify-between items-center sticky top-0 z-20">
      <button onClick={onMenuClick} className="md:hidden text-gray-600 hover:text-green-600 transition">
        <Menu size={26} />
      </button>
      <h1 className="text-lg font-semibold text-gray-800">
        Welcome, {user?.fullName || "FPO Manager"}
      </h1>
      <UserCircle size={30} className="text-gray-500" />
    </header>
  );
};

export default Header;
