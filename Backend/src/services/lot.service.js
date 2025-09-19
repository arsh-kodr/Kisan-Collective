// src/services/lot.service.js
const mongoose = require("mongoose");
const Lot = require("../models/lot.model");
const Bid = require("../models/bid.model");
const Order = require("../models/order.model"); // new model (see below)
const { getIO } = require("../config/socket");
const Razorpay = require("razorpay");

const razor = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
  : null;

/**
 * Finalize closure for a lot.
 * Creates an order (status: pending_payment) when there is a top bid and optionally creates a Razorpay order.
 */
async function finalizeLotClosure(lotId, actor = "system") {
  // use session/transaction where possible to avoid races
  const session = await mongoose.startSession();
  let createdOrder = null;
  try {
    session.startTransaction();

    // re-fetch lot under session
    const lot = await Lot.findOne({ _id: lotId }).session(session);
    if (!lot || lot.status !== "open") {
      await session.abortTransaction();
      session.endSession();
      return null;
    }

    const topBid = await Bid.findOne({ lot: lotId })
      .sort({ amount: -1, createdAt: 1 })
      .populate("bidder")
      .session(session);

    // mark lot closed
    lot.status = "closed";
    lot.winningBid = topBid ? topBid._id : null;
    await lot.save({ session });

    if (topBid && topBid.bidder) {
      // create order record
      createdOrder = await Order.create(
        [{
          lot: lot._id,
          buyer: topBid.bidder._id,
          bid: topBid._id,
          amount: topBid.amount,
          currency: "INR",
          status: "pending_payment",
        }],
        { session }
      ).then(docs => docs[0]);

      // create Razorpay order if keys are configured
      if (razor) {
        const razorOrder = await razor.orders.create({
          amount: Math.round(topBid.amount * 100), // paise
          currency: "INR",
          receipt: `lot_${lot._id}`,
          payment_capture: 1,
        });
        createdOrder.razorpayOrderId = razorOrder.id;
        await createdOrder.save({ session });
      }
    } else {
      // No bids: optional behavior - you may want to revert listings -> open
      // Example (uncomment if desired):
      // await Listing.updateMany({ _id: { $in: lot.listings } }, { $set: { status: 'open', lot: null } }, { session });
    }

    await session.commitTransaction();
    session.endSession();

    // Emit events AFTER commit
    const io = getIO();
    const payload = {
      lotId: lot._id,
      winningBid: topBid ? {
        _id: topBid._id,
        amount: topBid.amount,
        bidder: {
          _id: topBid.bidder._id,
          username: topBid.bidder.username,
        },
      } : null,
      order: createdOrder ? {
        _id: createdOrder._id,
        amount: createdOrder.amount,
        razorpayOrderId: createdOrder.razorpayOrderId,
        status: createdOrder.status,
      } : null,
      actor,
    };

    io.to(`lot:${lot._id}`).emit("lot:closed", payload); // lot-specific
    io.emit("lot:closed", payload); // global

    return { lot, winningBid: topBid || null, order: createdOrder || null };
  } catch (err) {
    try { await session.abortTransaction(); } catch (e) {}
    session.endSession();
    console.error("Error in finalizeLotClosure:", err);
    throw err;
  }
}

module.exports = { finalizeLotClosure };
