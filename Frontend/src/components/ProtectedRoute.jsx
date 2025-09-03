import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute({ children , roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
   if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />; // redirect to home (or 403 page later)
  }
  
  return children;
}
