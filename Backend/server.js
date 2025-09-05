require("dotenv").config();
const http = require("http");
const app = require("./src/app");
const connectToDB = require("./src/config/db");
const { initSocket } = require("./src/config/socket");
const Lot = require("./src/models/lot.model");
const { autoCloseLot } = require("./src/controllers/lot.controller");

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectToDB();

    const server = http.createServer(app);

    // ✅ Initialize Socket.IO
    initSocket(server);

    // ===============================
    // Auto-close expired lots
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
          await autoCloseLot(lot._id);
        }
      } catch (err) {
        console.error("Error auto-closing lots:", err);

      }
    }, AUTO_CLOSE_INTERVAL);

    server.listen(PORT, () =>
      console.log(`Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
})();
