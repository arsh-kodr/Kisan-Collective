require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const connectToDB = require("./src/config/db");
const { Server } = require("socket.io");
const Lot = require("./src/models/lot.model");
const { autoCloseLot } = require("./src/controllers/lot.controller");

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectToDB();

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: [
          process.env.FRONTEND_URL || "http://localhost:5173",
          "http://localhost:5173",
          "https://kisan-collective-frontend.onrender.com",
        ],
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["polling", "websocket"],
      allowEIO3: true,
    });

    // Socket connections
    io.on("connection", (socket) => {
      console.log("Socket connected:", socket.id);

      socket.on("join:lot", (lotId) => {
        if (lotId) socket.join(`lot:${lotId}`);
      });

      socket.on("leave:lot", (lotId) => {
        if (lotId) socket.leave(`lot:${lotId}`);
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
      });
    });

    // Attach io to app so controllers can use it
    app.set("io", io);

    // ===============================
    // Auto-close lots whose endTime passed every 5 seconds
    // ===============================
    const AUTO_CLOSE_INTERVAL = 5000;
    setInterval(async () => {
      try {
        const now = new Date();
        const lotsToClose = await Lot.find({
          status: "open",
          endTime: { $lte: now },
        });

        for (const lot of lotsToClose) {
          await autoCloseLot(lot._id, io);
        }
      } catch (err) {
        console.error("Error auto-closing lots:", err);
      }
    }, AUTO_CLOSE_INTERVAL);

    server.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
})();
