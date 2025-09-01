
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Lots from "./pages/Lots";
import LotDetail from "./pages/LotDetail";
import Orders from "./pages/Orders";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lots" element={<Lots />} />
          <Route path="/lots/:id" element={<LotDetail />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="/orders"
            element={<ProtectedRoute><Orders /></ProtectedRoute>}
          />
        </Routes>
      </main>
    </div>
  );
}
