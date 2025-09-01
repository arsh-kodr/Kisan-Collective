import { useState, useEffect } from "react";
import api from "../api";

const BidsList = ({ lotId, refreshInterval = 10000 }) => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBids = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/bids/lots/${lotId}`, { withCredentials: true });
      setBids(res.data.bids || []);
    } catch (err) {
      console.error("Error fetching bids:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();

    const interval = setInterval(() => {
      fetchBids();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [lotId, refreshInterval]);

  if (loading) return <p>Loading bids...</p>;

  return (
    <div className="mt-4">
      <h3 className="font-semibold mb-2">All Bids</h3>
      {bids.length > 0 ? (
        <ul className="space-y-2">
          {bids.map((b) => (
            <li key={b._id} className="border p-2 rounded flex justify-between">
              <span>{b.bidder?.username || "Unknown"} — ₹{b.amount}</span>
              <span className="text-xs text-gray-500">
                {new Date(b.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p>No bids yet</p>
      )}
    </div>
  );
};

export default BidsList;
