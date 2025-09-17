const Lot = require("../models/lot.model");
const Bid = require("../models/bid.model");
const { getIO } = require("../config/socket");

/**
 * Finalize closure for a lot (shared logic between manual close and auto-close jobs)
 * @param {String|ObjectId} lotId
 * @param {String} actor - who triggered the close (user id or "system")
 * @returns {Object|null} { lot, winningBid } or null if no-op
 */
async function finalizeLotClosure(lotId, actor = "system") {
  const lot = await Lot.findById(lotId);
  if (!lot || lot.status !== "open") return null;

  const topBid = await Bid.findOne({ lot: lotId }).sort({ amount: -1, createdAt: 1 });

  lot.status = "closed";
  lot.winningBid = topBid?._id || null;
  await lot.save();

  const io = getIO();
  // Emit to lot-specific room
  io.to(`lot:${lotId}`).emit(`lot:closed:${lotId}`, {
    lotId: lot._id,
    winningBid: topBid || null,
    actor,
  });
  // Also emit a marketplace-level update
  io.emit("lot:closed", { lotId: lot._id, actor, winningBid: topBid || null });

  return { lot, winningBid: topBid || null };
}

module.exports = {
  finalizeLotClosure,
};
