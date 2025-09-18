import { useState, useEffect, useMemo, useRef } from "react";
import api from "../api/api";
import { socket } from "../socket";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import PayNowButton from "./PayNowButton";
import toast from "react-hot-toast";

const BidsList = ({ lotId, winningBidId, onLotUpdate }) => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClosed, setIsClosed] = useState(false);
  const [lot, setLot] = useState(null);
  const { user } = useAuth();
  const listRef = useRef(null);

  const normalize = (raw) => ({
    _id: raw._id ?? raw.id,
    amount: raw.amount ?? raw.bid?.amount ?? 0,
    createdAt: raw.createdAt ?? raw.bid?.createdAt ?? new Date().toISOString(),
    bidder: raw.bidder ?? raw.bid?.bidder ?? {},
    isWinner: !!(raw.isWinner || raw.is_winner),
    raw,
    lotId: raw.lot ?? raw.lotId ?? raw.bid?.lot ?? null,
  });

  const fetchBidsAndLot = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/bids/lots/${lotId}`, { withCredentials: true });
      if (res.data?.lot) setLot(res.data.lot);

      const rawBids = res.data?.bids ?? [];
      const sortedBids = rawBids.map(normalize).sort((a, b) => b.amount - a.amount);
      setBids(sortedBids);

      const lotStatus = res.data?.lot?.status ?? res.data?.status;
      const closed = lotStatus === "closed" || lotStatus === "sold";
      setIsClosed(closed);

      onLotUpdate?.({ lot: res.data.lot, closed });
    } catch (err) {
      console.error("Error fetching bids/lot:", err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToTop = () => {
    if (listRef.current) {
      listRef.current.scrollTop = 0; // keep newest bid at top
    }
  };

  useEffect(() => {
    if (!lotId) return;
    fetchBidsAndLot();

    const handleNewBid = ({ bid }) => {
      const nb = normalize(bid);
      if (String(nb.lotId) !== String(lotId)) return;

      setBids((prev) => {
        if (prev.some((b) => String(b._id) === String(nb._id))) return prev;
        const updated = [nb, ...prev];
        return updated.sort((a, b) => b.amount - a.amount);
      });

      toast.success(`New highest bid: ₹${nb.amount}`);
      scrollToTop();
    };

    const handleLotClosed = ({ winningBid }) => {
      setIsClosed(true);
      if (winningBid) {
        const wb = normalize(winningBid);
        setBids((prev) =>
          prev.map((b) => (String(b._id) === String(wb._id) ? { ...b, isWinner: true } : b))
        );
        if (String(winningBid.bidder?._id ?? winningBid.bidder) === String(user?._id)) {
          toast.success("🎉 You won this auction! Pay now to confirm your order.");
        }
      }
      onLotUpdate?.({ lot, closed: true });
    };

    socket.on(`bid:new:${lotId}`, handleNewBid);
    socket.on(`lot:closed:${lotId}`, handleLotClosed);

    return () => {
      socket.off(`bid:new:${lotId}`, handleNewBid);
      socket.off(`lot:closed:${lotId}`, handleLotClosed);
    };
  }, [lotId, user?._id]);

  const minNextBid = useMemo(() => {
    if (!lot) return 0;
    const lotMin = lot.totalQuantity * lot.basePrice;
    return bids.length > 0 ? Math.max(lotMin, bids[0].amount + 1) : lotMin;
  }, [lot, bids]);

  const renderedBids = useMemo(
    () =>
      bids.map((b) => {
        const isWinner = String(winningBidId) === String(b._id) || b.isWinner;
        const isUserWinner =
          isWinner && user && String(b.bidder?._id ?? b.bidder) === String(user._id);

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
              <span className="font-medium text-gray-700">
                {b.bidder?.username ?? b.bidder?.name ?? "Unknown"}
              </span>
              <span className="text-xs text-gray-400">
                {new Date(b.createdAt).toLocaleString()}
              </span>
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
                    toast.success("Payment successful, order confirmed!");
                    fetchBidsAndLot();
                  }}
                />
              )}
            </div>
          </motion.li>
        );
      }),
    [bids, user, winningBidId, isClosed]
  );

  if (loading)
    return <p className="text-gray-500 text-sm animate-pulse">Loading bids...</p>;
  if (!bids.length)
    return (
      <div className="p-4 border rounded-lg bg-gray-50 text-gray-600 text-center">
        No bids yet
        {!isClosed && (
          <div className="mt-2 text-sm text-blue-700">
            Minimum Next Bid: ₹{lot ? lot.totalQuantity * lot.basePrice : 0}
          </div>
        )}
      </div>
    );

  return (
    <div className="mt-4 space-y-3">
      {!isClosed && (
        <div className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg text-sm font-medium text-center">
          Minimum Next Bid: ₹{minNextBid}
        </div>
      )}
      {isClosed && (
        <div className="px-4 py-2 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg text-sm font-medium text-center">
          🏁 Auction Closed
        </div>
      )}

      {/* Scrollable bid list */}
      <div
        ref={listRef}
        className="h-50 overflow-y-auto p-2 border border-gray-200 rounded-xl bg-white"
      >
        <ul className="space-y-2">
          <AnimatePresence>{renderedBids}</AnimatePresence>
        </ul>
      </div>  
    </div>
  );
};

export default BidsList;
