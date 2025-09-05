import { useState, useEffect } from "react";
import api from "../api/api";
import { socket } from "../socket";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import PayNowButton from "./PayNowButton";
import toast from "react-hot-toast";

const BidsList = ({ lotId, winningBidId }) => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClosed, setIsClosed] = useState(false);

  const { user } = useAuth();

  const fetchBids = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/bids/lots/${lotId}`, { withCredentials: true });
      setBids(res.data.bids || []);
      setIsClosed(res.data.lot?.status === "closed");
    } catch (err) {
      console.error("Error fetching bids:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();

    const handleNewBid = () => fetchBids();
    const handleLotClosed = ({ winningBid }) => {
      setIsClosed(true);
      if (winningBid) {
        setBids((prev) =>
          prev.map((b) =>
            b._id === winningBid._id ? { ...b, isWinner: true } : b
          )
        );

        if (winningBid.bidder?._id === user?._id) {
          toast.success("🎉 You won this auction! Pay now to confirm your order.");
        }
      }
    };

    socket.on(`bid:new:${lotId}`, handleNewBid);
    socket.on(`lot:closed:${lotId}`, handleLotClosed);

    return () => {
      socket.off(`bid:new:${lotId}`, handleNewBid);
      socket.off(`lot:closed:${lotId}`, handleLotClosed);
    };
  }, [lotId, user]);

  if (loading)
    return <p className="text-gray-500 text-sm animate-pulse">Loading bids...</p>;

  if (bids.length === 0)
    return (
      <div className="p-4 border rounded-lg bg-gray-50 text-gray-600 text-center">
        No bids yet
      </div>
    );

  return (
    <div className="mt-4 space-y-3">
      {isClosed && (
        <div className="px-4 py-2 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg text-sm font-medium text-center">
          🏁 Auction Closed
        </div>
      )}

      <ul className="space-y-2">
        <AnimatePresence>
          {bids.map((b) => {
            const isWinner = winningBidId === b._id || b.isWinner;
            const isUserWinner = isWinner && user && b.bidder?._id === user._id;

            return (
              <motion.li
                key={b._id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className={`flex justify-between items-center px-4 py-3 text-sm rounded-xl shadow-sm transition
                  ${isWinner ? "bg-green-50 border-l-4 border-green-500" : "bg-white hover:shadow-md"}`}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-gray-700">{b.bidder?.username || "Unknown"}</span>
                  <span className="text-xs text-gray-400">{new Date(b.createdAt).toLocaleString()}</span>
                </div>

                <div className="flex items-center gap-3">
                  {isWinner && (
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        isUserWinner ? "bg-green-600 text-white" : "bg-yellow-200 text-yellow-800"
                      }`}
                    >
                      {isUserWinner ? "You Won" : "Winner"}
                    </span>
                  )}

                  <span className={`font-semibold ${isWinner ? "text-green-700" : "text-gray-800"}`}>
                    ₹{b.amount}
                  </span>

                  {isUserWinner && isClosed && (
                    <PayNowButton
                      lotId={lotId}
                      amount={b.amount}
                      onPaymentSuccess={() => {
                        toast.success("✅ Payment successful, order confirmed!");
                        fetchBids();
                      }}
                    />
                  )}
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
};

export default BidsList;
