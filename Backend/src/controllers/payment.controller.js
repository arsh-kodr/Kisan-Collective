const Razorpay = require("razorpay");
const crypto = require("crypto");

const Transaction = require("../models/transaction.model");
const Order = require("../models/order.model");
const Lot = require("../models/lot.model");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Initiate a payment order
 * Accepts amount in rupees (converts to paise)
 */
const initiatePayment = async (req, res) => {
  try {
    const { lotId, amount } = req.body;
    if (!lotId || !amount) {
      return res.status(400).json({ message: "lotId and amount required" });
    }

    // Convert to paise
    const amountPaise = Math.round(amount * 100);

    // Fetch lot & winning bid
    const lot = await Lot.findById(lotId).populate({
      path: "winningBid",
      populate: { path: "bidder" },
    });
    if (!lot || !lot.winningBid) {
      return res.status(404).json({ message: "Lot or winning bid not found" });
    }
    if (lot.winningBid.bidder._id.toString() !== req.user.sub) {
      return res.status(403).json({ message: "Not authorized to pay for this lot" });
    }

    // Create short receipt (≤40 chars) but keep lotId in metadata
    const receipt = `lot_${lotId}_${Date.now()}`.slice(-40);

    // Create Razorpay order
    const rpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes: { lotId: lotId.toString(), buyerId: req.user.sub }, // ✅ safer lookup
    });

    // Create local transaction
    const tx = await Transaction.create({
      lot: lot._id,
      bid: lot.winningBid._id,
      buyer: lot.winningBid.bidder._id,
      amountPaise,
      currency: "INR",
      provider: "razorpay",
      providerOrderId: rpOrder.id,
      status: "pending",
    });

    return res.json({ success: true, order: rpOrder, transaction: tx });
  } catch (err) {
    console.error("initiatePayment error:", err);
    return res.status(500).json({ message: "Could not initiate payment" });
  }
};

/**
 * Verify payment after checkout
 */
const verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ message: "orderId, paymentId, signature required" });
    }

    const tx = await Transaction.findOne({ providerOrderId: orderId, buyer: req.user.sub });
    if (!tx) return res.status(404).json({ success: false, message: "Pending transaction not found" });

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // Update transaction → succeeded
    const updated = await Transaction.findOneAndUpdate(
      { _id: tx._id, status: "pending" },
      {
        $set: {
          providerPaymentId: paymentId,
          providerSignature: signature,
          status: "succeeded",
          providerPaymentMeta: { verifiedAt: new Date() },
        },
      },
      { new: true }
    );

    const finalTx = updated || tx;

    // Ensure order exists or update
    let order = await Order.findOne({ lot: finalTx.lot, buyer: finalTx.buyer });
    if (!order) {
      const lot = await Lot.findById(finalTx.lot).populate("winningBid");
      if (lot?.winningBid) {
        order = await Order.create({
          lot: lot._id,
          buyer: finalTx.buyer,
          fpo: lot.fpo,
          bid: lot.winningBid._id,
          amount: lot.winningBid.amount,
          transaction: finalTx._id,
          paymentStatus: "paid",
          status: "processing",
        });
      }
    } else {
      order.paymentStatus = "paid";
      order.status = "processing";
      order.transaction = finalTx._id;
      await order.save();
    }

    return res.json({ success: true, message: "Payment verified", transaction: finalTx, order });
  } catch (err) {
    console.error("verifyPayment error:", err);
    return res.status(500).json({ message: "Verification failed" });
  }
};

/**
 * Razorpay Webhook
 */
const webhookHandler = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const rawBody = req.body;
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (signature !== expected) {
      return res.status(400).json({ ok: false, message: "invalid signature" });
    }

    const event = JSON.parse(rawBody.toString("utf8"));
    const evt = event.event;

    if (evt === "payment.captured" || evt === "payment.failed") {
      const payment = event.payload.payment.entity;

      let tx = await Transaction.findOne({ providerOrderId: payment.order_id });
      if (!tx) {
        // Try to reconstruct tx from order notes
        const rpOrder = await razorpay.orders.fetch(payment.order_id).catch(() => null);
        const lotId = rpOrder?.notes?.lotId;
        const buyerId = rpOrder?.notes?.buyerId;

        if (lotId && buyerId) {
          const lot = await Lot.findById(lotId).populate("winningBid");
          if (lot?.winningBid?.bidder) {
            tx = await Transaction.create({
              lot: lot._id,
              bid: lot.winningBid._id,
              buyer: lot.winningBid.bidder._id,
              amountPaise: payment.amount,
              currency: payment.currency,
              providerOrderId: payment.order_id,
              providerPaymentId: payment.id,
              providerPaymentMeta: payment,
              status: evt === "payment.captured" ? "succeeded" : "failed",
            });
          }
        }
      }

      if (tx) {
        const targetStatus = evt === "payment.captured" ? "succeeded" : "failed";

        const updated = await Transaction.findOneAndUpdate(
          { _id: tx._id },
          {
            $set: {
              providerPaymentId: payment.id,
              providerPaymentMeta: payment,
              status: targetStatus,
            },
          },
          { new: true }
        );

        const finalTx = updated || tx;

        // Ensure order exists
        let order = await Order.findOne({ lot: finalTx.lot, buyer: finalTx.buyer });
        if (!order && targetStatus === "succeeded") {
          const lot = await Lot.findById(finalTx.lot).populate("winningBid");
          if (lot?.winningBid) {
            order = await Order.create({
              lot: lot._id,
              buyer: finalTx.buyer,
              fpo: lot.fpo,
              bid: lot.winningBid._id,
              amount: lot.winningBid.amount,
              transaction: finalTx._id,
              paymentStatus: "paid",
              status: "processing",
            });
          }
        } else if (order) {
          const orderUpdate =
            targetStatus === "succeeded"
              ? { paymentStatus: "paid", status: "processing", transaction: finalTx._id }
              : { paymentStatus: "failed", status: "payment_failed" };
          await Order.findByIdAndUpdate(order._id, { $set: orderUpdate });
        }

        console.log(`Processed payment event: ${evt} for tx: ${finalTx._id}`);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.status(500).json({ ok: false, message: "webhook processing error" });
  }
};

module.exports = {
  initiatePayment,
  verifyPayment,
  webhookHandler,
};
