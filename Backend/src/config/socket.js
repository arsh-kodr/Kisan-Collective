// src/config/socket.js
let ioInstance;

function initSocket(server) {
  const { Server } = require("socket.io");

  ioInstance = new Server(server, {
    cors: {
      origin: [process.env.FRONTEND_URL || "http://localhost:5173"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  ioInstance.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join:lot", (lotId) => {
      if (lotId) {
        socket.join(`lot:${lotId}`);
        console.log(`Socket ${socket.id} joined lot:${lotId}`);
      }
    });

    socket.on("leave:lot", (lotId) => {
      if (lotId) {
        socket.leave(`lot:${lotId}`);
        console.log(`Socket ${socket.id} left lot:${lotId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return ioInstance;
}

function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized! Call initSocket first.");
  }
  return ioInstance;
}

module.exports = { initSocket, getIO };
