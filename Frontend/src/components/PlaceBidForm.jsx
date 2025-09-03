// src/components/PlaceBidForm.jsx
import { useState, useEffect, useRef } from "react";
import api from "../api";
import toast from "react-hot-toast";

const PlaceBidForm = ({ lotId, onBidPlaced }) => {
  const [amount, setAmount] = useState("");
  const [highestBid, setHighestBid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingHighest, setFetchingHighest] = useState(true);
  const prevHighest = useRef(null); // ✅ to track last highest bid

  // ✅ Fetch current highest bid
  const fetchHighest = async () => {
    try {
      setFetchingHighest(true);
      const res = await api.get(`/bids/lots/${lotId}/highest`, {
        withCredentials: true,
      });
      const newHighest = res.data.highestBid || null;

      // 🔥 Show toast if new highest is detected
      if (
        newHighest &&
        prevHighest.current &&
        newHighest.amount > prevHighest.current.amount
      ) {
        toast.success(
          `New highest bid: ₹${newHighest.amount} by ${newHighest.bidder?.username || "someone"}`
        );
      }

      setHighestBid(newHighest);
      prevHighest.current = newHighest;
    } catch (err) {
      console.error("Error fetching highest bid:", err);
      toast.error("Failed to fetch highest bid");
    } finally {
      setFetchingHighest(false);
    }
  };

  useEffect(() => {
    fetchHighest();
    const interval = setInterval(fetchHighest, 8000); // refresh every 8s
    return () => clearInterval(interval);
  }, [lotId]);

  // ✅ Handle bid submission
  const handleSubmit = async (e) => {
    e.preventDefault();
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
      prevHighest.current = newBid;
      onBidPlaced?.(newBid);

      toast.success("✅ Bid placed successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to place bid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-2xl bg-gradient-to-br from-green-50 to-white p-6 shadow-md">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Place a Bid</h3>
        {fetchingHighest ? (
          <span className="text-sm text-gray-500 animate-pulse">
            Checking highest bid...
          </span>
        ) : (
          <span className="text-sm text-gray-600">
            Current Highest:{" "}
            <span className="font-semibold text-green-700">
              {highestBid ? `₹${highestBid.amount}` : "No bids yet"}
            </span>
          </span>
        )}
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
          placeholder={`Enter bid (min ₹${
            highestBid ? highestBid.amount + 1 : 1
          })`}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition"
          min={highestBid ? highestBid.amount + 1 : 1}
          required
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-6 py-2 rounded-xl font-medium shadow hover:bg-green-700 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Placing..." : "Place Bid"}
        </button>
      </form>
    </div>
  );
};

export default PlaceBidForm;
