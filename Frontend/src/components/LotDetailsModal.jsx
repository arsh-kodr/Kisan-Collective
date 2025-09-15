import { useEffect, useState } from "react";
import api from "../api/api";
import config from "../config/config";

const { apiRoutes } = config;

export default function LotDetailsModal({ lot, onClose, onAction }) {
  const [bids, setBids] = useState([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!lot) return;
    const loadBids = async () => {
      setLoadingBids(true);
      try {
        const res = await api.get(apiRoutes.bids.forLot(lot._id));
        // defensive
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
              {/* l may be id string or populated object */}
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

        <div className="flex space-x-2 mt-4">
          {lot.status === "open" && (
            <button onClick={handleCloseAuction} disabled={closing} className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg">
              {closing ? "Closing..." : "Close Auction"}
            </button>
          )}
          <button onClick={onClose} className="flex-1 bg-gray-200 px-4 py-2 rounded-lg">Close</button>
        </div>
      </div>
    </div>
  );
}
