import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard"; // role-based redirect
import Lots from "./pages/BrowseLots";
import LotDetail from "./pages/LotDetail";
import ProtectedRoute from "./components/ProtectedRoute";
import FarmerListings from "./pages/FarmerListings";
import FpoDashboard from "./pages/FpoDashboard";
import BuyerDashboard from "./pages/BuyerDashboard"; // full buyer dashboard
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/lots" element={<Lots />} />
          <Route path="/lots/:id" element={<LotDetail />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Protected role-based dashboards */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/buyer/dashboard"
            element={
              <ProtectedRoute roles={["buyer"]}>
                <BuyerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/farmer/dashboard"
            element={
              <ProtectedRoute roles={["farmer"]}>
                <FarmerListings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/fpo/dashboard"
            element={
              <ProtectedRoute roles={["fpo"]}>
                <FpoDashboard />
              </ProtectedRoute>
            }
          />

          {/* Unauthorized & 404 */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Global toast notifications */}
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}
