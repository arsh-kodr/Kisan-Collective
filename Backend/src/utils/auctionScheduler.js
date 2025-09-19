// utils/auctionScheduler.js
const Lot = require("../models/lot.model");
const { finalizeLotClosure } = require("../services/lot.service");

/**
 * Schedule auto-close for a lot using finalizeLotClosure from services.
 * Accepts either a Lot document or an object with _id and endTime.
 */
const scheduleLotClosure = (lot) => {
  if (!lot || !lot.endTime || lot.status !== "open") return;

  const delay = new Date(lot.endTime).getTime() - Date.now();
  if (delay <= 0) return; // already passed

  setTimeout(async () => {
    try {
      await finalizeLotClosure(lot._id, "system");
    } catch (err) {
      console.error("Error running scheduled finalizeLotClosure for lot", lot._id, err);
    }
  }, delay);
};

/**
 * On server start, find open lots with future endTime and schedule them.
 * Call this once after DB + socket are up.
 */
const initLotSchedulers = async () => {
  try {
    const lots = await Lot.find({ status: "open", endTime: { $gt: new Date() } }).lean();
    lots.forEach(scheduleLotClosure);
    console.log(`auctionScheduler: scheduled ${lots.length} upcoming lots`);
  } catch (err) {
    console.error("Error initializing lot schedulers:", err);
  }
};

module.exports = { scheduleLotClosure, initLotSchedulers };
