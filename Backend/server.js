// server.js
require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const connectToDB = require("./src/config/db");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectToDB();

    // ✅ Create HTTP server from Express app
    const server = http.createServer(app);

    // ✅ Attach socket.io to this server
    const io = new Server(server, {
      cors: {
        origin: [
          process.env.FRONTEND_URL || "http://localhost:5173",
          "http://localhost:5173",
          "https://kisan-collective-frontend.onrender.com"
        ],
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"], // allow both
      allowEIO3: true, // ✅ compatibility with older clients/proxies
    });

    // ✅ Socket.IO events
    io.on("connection", (socket) => {
      console.log("✅ Socket connected:", socket.id);

      socket.on("join:lot", (lotId) => {
        if (lotId) {
          socket.join(`lot:${lotId}`);
          console.log(`🔗 Joined room lot:${lotId}`);
        }
      });

      socket.on("leave:lot", (lotId) => {
        if (lotId) {
          socket.leave(`lot:${lotId}`);
          console.log(`❌ Left room lot:${lotId}`);
        }
      });

      socket.on("disconnect", () => {
        console.log("❌ Socket disconnected:", socket.id);
      });
    });

    // ✅ Make io available in controllers
    app.set("io", io);

    // ✅ Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
})();
