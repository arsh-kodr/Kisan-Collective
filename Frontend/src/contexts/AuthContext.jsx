import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // track if auth state is loading

  // Persist login on refresh
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      api.get("/auth/profile")
        .then((res) => setUser(res.data))
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

  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
