// src/components/fpo/CreateLotModal.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import lotApi from "../../api/lotApi";
import listingApi from "../../api/listing";
import toast from "react-hot-toast";

const CreateLotModal = ({ onClose }) => {
  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [autoCloseTime, setAutoCloseTime] = useState("");
  const [listings, setListings] = useState([]);
  const [selectedListings, setSelectedListings] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Load approved listings
  const fetchListings = async () => {
    try {
      const res = await listingApi.getListings(); // approved + open listings
      setListings(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Failed to load listings:", err);
      toast.error("Failed to load listings");
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // ✅ Submit lot
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newLot = await lotApi.createLot({
        name,
        basePrice,
        endTime: autoCloseTime, // backend expects endTime
        listings: selectedListings,
      });

      toast.success(`Lot "${newLot.name}" created successfully!`);
      onClose();
    } catch (err) {
      console.error("Failed to create lot:", err);
      toast.error("Failed to create lot");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Toggle listings
  const toggleListingSelection = (id) => {
    setSelectedListings((prev) =>
      prev.includes(id) ? prev.filter((lid) => lid !== id) : [...prev, id]
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative"
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>

          {/* Title */}
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Create New Lot
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Lot Name */}
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Lot Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="E.g. Wheat Harvest Lot 2025"
              />
            </div>

            {/* Base Price */}
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Base Price (₹)
              </label>
              <input
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter minimum bid price"
              />
            </div>

            {/* Auto Close Time */}
            <div>
              <label className="block text-sm font-medium text-gray-600">
                Auto Close Time
              </label>
              <input
                type="datetime-local"
                value={autoCloseTime}
                onChange={(e) => setAutoCloseTime(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Select Listings */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Select Listings
              </label>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-2">
                {listings.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No available listings found
                  </p>
                ) : (
                  listings.map((listing) => (
                    <label
                      key={listing._id}
                      className="flex items-center gap-2 py-1 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedListings.includes(listing._id)}
                        onChange={() => toggleListingSelection(listing._id)}
                      />
                      <span className="text-sm text-gray-700">
                        {listing.crop} – {listing.quantityKg} kg
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm transition disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Lot"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreateLotModal;
