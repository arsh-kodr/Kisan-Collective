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
   forceNew: true,
});

// -----------------------
// Socket event logging
// -----------------------
socket.on("connect", () => {
  console.log("✅ Socket connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("❌ Socket connection error:", err.message);
});

socket.on("disconnect", (reason) => {
  console.log("⚡ Socket disconnected:", reason);
});

socket.on("reconnect_attempt", (attempt) => {
  console.log(`🔄 Socket attempting to reconnect (attempt ${attempt})`);
});

socket.on("reconnect_failed", () => {
  console.error("❌ Socket failed to reconnect after max attempts");
});
