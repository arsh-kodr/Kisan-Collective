// src/socket.js
import { io } from "socket.io-client";

// ✅ Use Render backend URL in production, localhost in dev
const BACKEND_URL =
  import.meta.env.MODE === "production"
    ? "https://kisan-collective.onrender.com"
    : "http://localhost:3000";

export const socket = io(BACKEND_URL, {
  withCredentials: true,
  transports: ["websocket", "polling"], // fallback for Render proxy
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});
