// utils/auctionScheduler.js
const Lot = require("../models/lot.model");
const Bid = require("../models/bid.model");
const { getIO } = require("../config/socket");

/**
 * Schedule auto-close for a lot
 * @param {Object} lot - Lot document
 */
const scheduleLotClosure = (lot) => {
  if (!lot.endTime || lot.status !== "open") return;

  const delay = new Date(lot.endTime) - Date.now();
  if (delay <= 0) return; // Already expired

  setTimeout(async () => {
    try {
      const topBid = await Bid.findOne({ lot: lot._id }).sort({ amount: -1 });
      lot.status = "closed";
      lot.winningBid = topBid?._id || null;
      await lot.save();

      const io = getIO();

      // Notify all clients in this lot room
      io.to(`lot:${lot._id}`).emit(`lot:closed:${lot._id}`, {
        winningBid: topBid,
      });

      // Notify globally (frontend dashboards, etc.)
      io.emit("lot:ended", { lotId: lot._id });

      console.log(`Lot ${lot._id} auto-closed`);
    } catch (err) {
      console.error("Error auto-closing lot:", err);
    }
  }, delay);
};

module.exports = { scheduleLotClosure };
