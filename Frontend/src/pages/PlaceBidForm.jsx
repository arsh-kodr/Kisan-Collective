import { useState, useEffect } from "react";
import api from "../api";

const PlaceBidForm = ({ lotId, onBidPlaced }) => {
  const [amount, setAmount] = useState("");
  const [highestBid, setHighestBid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // fetch highest bid on mount
  const fetchHighest = async () => {
    try {
      const res = await api.get(`/bids/lots/${lotId}/highest`, { withCredentials: true });
      setHighestBid(res.data.highestBid || null);
    } catch (err) {
      console.error("Error fetching highest bid:", err);
    }
  };

  useEffect(() => {
    fetchHighest();
  }, [lotId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post(
        "/bids/place-bid",
        { lotId, amount: Number(amount) },
        { withCredentials: true }
      );

      const newBid = res.data.bid;
      setAmount("");
      setHighestBid(newBid);
      onBidPlaced && onBidPlaced(newBid); // immediately update highest bid in LotDetail
      alert("✅ " + res.data.message);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to place bid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border p-4 rounded bg-gray-50">
      <h3 className="font-semibold mb-2">Place a Bid</h3>
      <p className="mb-2 text-sm">
        Current Highest: {highestBid ? `₹${highestBid.amount}` : "No bids yet"}
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter bid amount"
          className="border px-2 py-1 rounded mr-2"
          min={highestBid ? highestBid.amount + 1 : 1}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-1 rounded"
        >
          {loading ? "Placing..." : "Place Bid"}
        </button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default PlaceBidForm;
