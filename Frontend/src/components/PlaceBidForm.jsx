import { useState, useEffect } from "react";
import api from "../api/api";
import toast from "react-hot-toast";
import { socket } from "../socket";
import { motion } from "framer-motion";

const PlaceBidForm = ({ lotId, lotBasePrice = 0, onBidPlaced, currentUserId }) => {
  const [amount, setAmount] = useState("");
  const [highestBid, setHighestBid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);

  // Listen for new bids and auction closure
  useEffect(() => {
    const handleNewBid = ({ bid }) => {
      if (!highestBid || bid.amount > highestBid.amount) {
        setHighestBid(bid);
        toast.success(`New highest bid: ₹${bid.amount} by ${bid.bidder?.username || "someone"}`);
      }
    };

    const handleLotClosed = ({ winningBid }) => {
      setDisabled(true);
      toast.error("Auction ended! You can no longer place bids.");
      if (winningBid) setHighestBid(winningBid);
    };

    socket.on(`bid:new:${lotId}`, handleNewBid);
    socket.on(`lot:closed:${lotId}`, handleLotClosed);

    return () => {
      socket.off(`bid:new:${lotId}`, handleNewBid);
      socket.off(`lot:closed:${lotId}`, handleLotClosed);
    };
  }, [lotId, highestBid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled) return;

    const minBid = Math.max(highestBid?.amount + 1 || 1, lotBasePrice);
    if (Number(amount) < minBid) {
      toast.error(`Bid must be at least ₹${minBid}`);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(
        "/bids/place-bid",
        { lotId, amount: Number(amount) },
        { withCredentials: true }
      );
      const newBid = res.data.bid;
      setAmount("");
      setHighestBid(newBid);
      onBidPlaced?.(newBid);

      toast.success("✅ Bid placed successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to place bid");
    } finally {
      setLoading(false);
    }
  };

  const isHighestBidder = highestBid?.bidder?._id === currentUserId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border rounded-2xl bg-gradient-to-br from-green-50 to-white p-6 shadow-md"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Place a Bid</h3>
        <span className="text-sm text-gray-600">
          Current Highest:{" "}
          <span className={`font-semibold ${isHighestBidder ? "text-blue-700" : "text-green-700"}`}>
            {highestBid ? `₹${highestBid.amount}` : `Min ₹${lotBasePrice}`}
            {isHighestBidder && " (You are highest bidder)"}
          </span>
        </span>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3 sm:items-center"
      >
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Enter bid (min ₹${Math.max(highestBid?.amount + 1 || 1, lotBasePrice)})`}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
          min={Math.max(highestBid?.amount + 1 || 1, lotBasePrice)}
          required
          disabled={loading || disabled}
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          type="submit"
          disabled={loading || disabled}
          className="bg-green-600 text-white px-6 py-2 rounded-xl font-medium shadow hover:bg-green-700 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Placing..." : disabled ? "Auction Ended" : "Place Bid"}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default PlaceBidForm;
