// src/components/fpo/CreateLotModal.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import lotApi from "../../api/lotApi";
import toast from "react-hot-toast";

const CreateLotModal = ({ onClose }) => {
  const [lotName, setLotName] = useState("");
  const [endTime, setEndTime] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lotName.trim()) return toast.error("Lot name is required");
    if (new Date(endTime) <= new Date()) return toast.error("End time must be in the future");

    setLoading(true);
    try {
      await lotApi.createLot({ name: lotName.trim(), autoCloseTime: endTime });
      toast.success("Lot created successfully");
      onClose();
    } catch {
      toast.error("Failed to create lot");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg"
      >
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Create Lot</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={lotName}
            onChange={(e) => setLotName(e.target.value)}
            placeholder="Lot name"
            className="w-full border px-3 py-2 rounded-lg bg-gray-50 text-gray-800"
            required
          />
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full border px-3 py-2 rounded-lg bg-gray-50 text-gray-800"
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CreateLotModal;
