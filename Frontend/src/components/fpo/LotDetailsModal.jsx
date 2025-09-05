import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import BidsList from "../BidsList";
import lotApi from "../../api/lotApi";
import toast from "react-hot-toast";

export default function LotDetailsModal({ lot, onClose, refresh }) {
  const [closing, setClosing] = useState(false);

  const handleCloseAuction = async () => {
    try {
      setClosing(true);
      await lotApi.closeLot(lot._id);
      toast.success("Auction closed successfully!");
      refresh();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to close auction");
    } finally {
      setClosing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Lot info */}
          <h2 className="text-xl font-semibold mb-2">{lot.name}</h2>
          <p className="text-sm text-gray-600 mb-4">
            {lot.listings?.length || 0} listings • {lot.totalQuantity} kg
          </p>

          {/* Status */}
          <span
            className={`inline-block text-xs px-3 py-1 rounded-full mb-4 ${
              lot.status === "open"
                ? "bg-green-100 text-green-700"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {lot.status}
          </span>

          {/* Bids */}
          <h3 className="text-md font-medium mb-2">Bids</h3>
          <BidsList lotId={lot._id} winningBidId={lot.winningBid} />

          {/* Actions */}
          {lot.status === "open" && (
            <div className="mt-6 flex justify-end">
              <button
                disabled={closing}
                onClick={handleCloseAuction}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow disabled:opacity-50"
              >
                {closing ? "Closing..." : "Close Auction"}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
