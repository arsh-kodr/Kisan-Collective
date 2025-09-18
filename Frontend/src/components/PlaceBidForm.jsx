import { useState, useEffect, useMemo } from "react";
import api from "../api/api";
import toast from "react-hot-toast";
import { socket } from "../socket";
import { motion } from "framer-motion";
import config from "../config/config";
const { apiRoutes } = config;

const PlaceBidForm = ({ lotId, currentUserId, onBidPlaced, onLotUpdate }) => {
  const [amount, setAmount] = useState("");
  const [highestBid, setHighestBid] = useState(null);
  const [lot, setLot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [disabled, setDisabled] = useState(false);

  // Fetch lot and bids
  const fetchLotAndBids = async () => {
    try {
      const res = await api.get(`/bids/lots/${lotId}`, { withCredentials: true });
      if (res.data?.lot) setLot(res.data.lot);

      const bids = res.data?.bids ?? [];
      if (bids.length > 0) {
        const sorted = bids.sort((a, b) => b.amount - a.amount);
        setHighestBid(sorted[0]);
      }

      const closed = ["closed", "sold"].includes(res.data?.lot?.status);
      setDisabled(closed);
      onLotUpdate?.({ lot: res.data.lot, closed });
    } catch (err) {
      console.error("fetchLotAndBids error:", err);
    }
  };

  useEffect(() => {
    fetchLotAndBids();

    socket.emit("join", { room: `lot:${lotId}` });

    const handleNewBid = ({ bid }) => {
      setHighestBid(prev => {
        if (!prev || bid.amount > prev.amount) {
          toast.success(`New highest bid: ₹${bid.amount}`);
          return bid;
        }
        return prev;
      });
    };

    const handleLotClosed = ({ winningBid }) => {
      setDisabled(true);
      toast.error("Auction ended! You can no longer place bids.");
      if (winningBid) setHighestBid(winningBid);
      onLotUpdate?.({ lot: lot, closed: true });
    };

    socket.on("bid:new", handleNewBid);
    socket.on("lot:closed", handleLotClosed);

    return () => {
      socket.off("bid:new", handleNewBid);
      socket.off("lot:closed", handleLotClosed);
    };
  }, [lotId]);

  // Minimum next bid
  const minNextBid = useMemo(() => {
    if (!lot) return 0;
    return highestBid?.amount ? highestBid.amount + 1 : lot.basePrice;
  }, [lot, highestBid]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled) return;

    const bidAmount = Number(amount);
    if (isNaN(bidAmount) || bidAmount < minNextBid) {
      toast.error(`Bid must be at least ₹${minNextBid}`);
      return;
    }

    setLoading(true);
    try {
      const res = await api.post(
        `${apiRoutes.bids.placeBid}`,
        { lotId, amount: bidAmount },
        { withCredentials: true }
      );

      const newBid = res.data; // backend returns populated bidder
      setAmount("");
      setHighestBid(newBid);
      onBidPlaced?.(newBid);
      toast.success("Bid placed successfully!");
    } catch (err) {
      console.error("placeBid error:", err);
      toast.error(err.response?.data?.message || "Failed to place bid");
    } finally {
      setLoading(false);
    }
  };

  // Safely check if current user is highest bidder
  const isHighestBidder =
    highestBid?.bidder?._id === currentUserId ||
    highestBid?.bidder === currentUserId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border rounded-2xl bg-gradient-to-br from-green-50 to-white p-6 shadow-md"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Place a Bid</h3>
        <span className="text-sm text-gray-600">
          Current Highest:{" "}
          <span
            className={`font-semibold ${
              isHighestBidder ? "text-blue-700" : "text-green-700"
            }`}
          >
            {highestBid
              ? `₹${highestBid.amount}`
              : `Min ₹${lot ? lot.basePrice : 0}`}
            {isHighestBidder && " (You are highest bidder)"}
          </span>
        </span>
      </div>

      <form
        className="flex flex-col sm:flex-row gap-3 sm:items-center"
        onSubmit={handleSubmit}
      >
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Enter bid (min ₹${minNextBid})`}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
          min={minNextBid}
          required
          disabled={loading || disabled}
        />
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.05 }}
          type="submit"
          disabled={loading || disabled || Number(amount) < minNextBid}
          className="bg-green-600 text-white px-6 py-2 rounded-xl font-medium shadow hover:bg-green-700 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Placing..." : disabled ? "Auction Ended" : "Place Bid"}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default PlaceBidForm;
