// src/utils/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api",
  withCredentials: true, // so refresh token cookies flow
});

// Attach token only if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken"); // or your state manager
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // If no token, remove Authorization header
    delete config.headers.Authorization;
  }
  return config;
});

export default api;
