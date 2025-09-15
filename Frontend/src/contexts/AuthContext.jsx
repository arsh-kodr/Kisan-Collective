import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // load profile on first render
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      api
        .get("/auth/profile")
        .then((res) => setUser(res.data.user)) // backend sends { user }
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { accessToken, user } = res.data;

    localStorage.setItem("accessToken", accessToken);
    setUser(user);
  };

  const register = async (payload) => {
    const res = await api.post("/auth/register", payload);
    const { accessToken, user } = res.data;

    localStorage.setItem("accessToken", accessToken);
    setUser(user);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout"); // clear cookie on backend
    } catch (e) {
      console.error("Logout error:", e.message);
    }
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export const useAuth = () => useContext(AuthContext);
