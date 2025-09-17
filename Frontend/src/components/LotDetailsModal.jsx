import { useEffect, useState } from "react";
import api from "../api/api";
import config from "../config/config";

const { apiRoutes } = config;

export default function LotDetailsModal({ lot, onClose, onAction }) {
  const [bids, setBids] = useState([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [closing, setClosing] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [bidAmount, setBidAmount] = useState("");

  useEffect(() => {
    if (!lot) return;
    const loadBids = async () => {
      setLoadingBids(true);
      try {
        const res = await api.get(apiRoutes.bids.forLot(lot._id));
        const payload = res.data;
        setBids(Array.isArray(payload) ? payload : payload.bids || []);
      } catch (err) {
        console.error("fetch bids", err);
      } finally {
        setLoadingBids(false);
      }
    };
    loadBids();
  }, [lot]);

  if (!lot) return null;

  const highestBid = bids.length > 0 ? Math.max(...bids.map((b) => b.amount)) : null;
  const minAllowed = highestBid ? Math.max(lot.basePrice, highestBid + 1) : lot.basePrice;

  const handlePlaceBid = async () => {
    const amount = Number(bidAmount);
    if (isNaN(amount) || amount < minAllowed) {
      alert(`Bid must be at least ₹${minAllowed}`);
      return;
    }

    try {
      setPlacing(true);
      const res = await api.post(apiRoutes.bids.create, {
        lotId: lot._id,
        amount,
      });
      setBids((prev) => [...prev, res.data]); // optimistic update
      setBidAmount("");
      onAction && onAction();
    } catch (err) {
      console.error("place bid", err);
      alert(err.response?.data?.message || "Failed to place bid");
    } finally {
      setPlacing(false);
    }
  };

  const handleCloseAuction = async () => {
    try {
      setClosing(true);
      await api.post(apiRoutes.lots.close(lot._id));
      onAction && onAction();
      onClose && onClose();
    } catch (err) {
      console.error("close auction", err);
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg">
        <h2 className="text-lg font-bold mb-4">{lot.name}</h2>
        <p><strong>Base Price:</strong> ₹{lot.basePrice}</p>
        <p><strong>Status:</strong> {lot.status}</p>
        <p><strong>Total Quantity:</strong> {lot.totalQuantity} kg</p>

        <h3 className="font-semibold mt-4 mb-2">Linked Listings</h3>
        <ul className="space-y-2 max-h-36 overflow-y-auto mb-3">
          {(lot.listings || []).map((l) => (
            <li key={l._id || l} className="border rounded-lg px-3 py-2">
              {typeof l === "string" ? l : (l.crop || l._id)}
            </li>
          ))}
        </ul>

        <h3 className="font-semibold mt-2 mb-2">Bids</h3>
        <div className="max-h-48 overflow-y-auto">
          {loadingBids ? <p>Loading bids...</p> : (
            <>
              {bids.length === 0 && <p>No bids yet.</p>}
              <ul className="space-y-2">
                {bids.map((b) => (
                  <li key={b._id} className="flex justify-between border rounded-lg px-3 py-2">
                    <span>{b.bidder?.username ?? b.bidder}</span>
                    <span className="font-semibold">₹{b.amount}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {lot.status === "open" && (
          <div className="mt-4">
            <label className="block text-sm mb-1">Your Bid (₹)</label>
            <input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 mb-2"
              min={minAllowed}
            />
            <button
              onClick={handlePlaceBid}
              disabled={placing}
              className="w-full bg-green-500 text-white px-4 py-2 rounded-lg"
            >
              {placing ? "Placing..." : `Place Bid (min ₹${minAllowed})`}
            </button>
          </div>
        )}

        <div className="flex space-x-2 mt-4">
          {lot.status === "open" && (
            <button
              onClick={handleCloseAuction}
              disabled={closing}
              className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg"
            >
              {closing ? "Closing..." : "Close Auction"}
            </button>
          )}
          <button onClick={onClose} className="flex-1 bg-gray-200 px-4 py-2 rounded-lg">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
