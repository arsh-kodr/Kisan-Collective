// src/components/BidsList.jsx
import { useState, useEffect } from "react";
import api from "../api";
import { socket } from "../socket";

const BidsList = ({ lotId }) => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBids = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/bids/lots/${lotId}`, {
        withCredentials: true,
      });
      setBids(res.data.bids || []);
    } catch (err) {
      console.error("Error fetching bids:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();

    // listen for new bids
    socket.on(`bid:new:${lotId}`, () => {
      fetchBids();
    });

    return () => {
      socket.off(`bid:new:${lotId}`);
    };
  }, [lotId]);

  if (loading) {
    return (
      <p className="text-gray-500 text-sm animate-pulse">Loading bids...</p>
    );
  }

  return (
    <div className="mt-4">
      {bids.length > 0 ? (
        <ul className="divide-y divide-gray-200 border rounded-lg overflow-hidden">
          {bids.map((b) => (
            <li
              key={b._id}
              className="flex justify-between items-center px-4 py-3 text-sm bg-white hover:bg-gray-50 transition"
            >
              <span className="font-medium text-gray-700">
                {b.bidder?.username || "Unknown"}
              </span>
              <span className="text-green-700 font-semibold">₹{b.amount}</span>
              <span className="text-xs text-gray-500">
                {new Date(b.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600">No bids yet</p>
      )}
    </div>
  );
};

export default BidsList;
