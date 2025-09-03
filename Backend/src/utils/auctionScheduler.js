// utils/auctionScheduler.js
const Lot = require("../models/lot.model");
const Bid = require("../models/bid.model");

/**
 * Schedule auto-close for a lot
 * @param {Object} io - Socket.io instance
 * @param {Object} lot - Lot document
 */
const scheduleLotClosure = (io, lot) => {
  if (!lot.endTime || lot.status !== "open") return;

  const delay = new Date(lot.endTime) - Date.now();
  if (delay <= 0) return; // Already expired

  setTimeout(async () => {
    try {
      const topBid = await Bid.findOne({ lot: lot._id }).sort({ amount: -1 });
      lot.status = "closed";
      lot.winningBid = topBid?._id || null;
      await lot.save();

      // Notify all clients in this lot room
      io.to(`lot:${lot._id}`).emit(`lot:closed:${lot._id}`, {
        winningBid: topBid,
      });

      // Notify frontend to disable bid form
      io.emit("lot:ended", { lotId: lot._id });

      console.log(`Lot ${lot._id} auto-closed`);
    } catch (err) {
      console.error("Error auto-closing lot:", err);
    }
  }, delay);
};

module.exports = { scheduleLotClosure };
