// src/components/EditListingModal.jsx
import React, { useState } from "react";
import api from "../api/api";
import toast from "react-hot-toast";

export default function EditListingModal({ listing, onClose, onSaved }) {
  const [form, setForm] = useState({
    crop: listing.crop || "",
    quantityKg: listing.quantityKg || 0,
    unit: listing.unit || "kg",
    harvestDate: listing.harvestDate ? listing.harvestDate.slice(0, 10) : "",
    mandiPriceAtEntry: listing.mandiPriceAtEntry || "",
    expectedPricePerKg: listing.expectedPricePerKg || "",
    location: listing.location || "",
    photos: listing.photos && listing.photos.length ? listing.photos : [""],
    status: listing.status || "open",
  });
  const [loading, setLoading] = useState(false);

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put(`/listings/${listing._id}`, form, {
        withCredentials: true,
      });
      toast.success("Listing updated");
      onSaved(res.data.listing || res.data);
    } catch (err) {
      console.error("Update failed:", err);
      toast.error(err?.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6 transform transition-transform animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit Listing</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Crop
            </label>
            <input
              name="crop"
              value={form.crop}
              onChange={handleField}
              required
              className="w-full border p-2 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Quantity
              </label>
              <input
                name="quantityKg"
                type="number"
                value={form.quantityKg}
                onChange={handleField}
                required
                className="w-full border p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Unit
              </label>
              <select
                name="unit"
                value={form.unit}
                onChange={handleField}
                className="w-full border p-2 rounded-lg"
              >
                <option value="kg">kg</option>
                <option value="quintal">quintal</option>
                <option value="tonne">tonne</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Harvest Date
            </label>
            <input
              name="harvestDate"
              type="date"
              value={form.harvestDate}
              onChange={handleField}
              className="w-full border p-2 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mandi Price
              </label>
              <input
                name="mandiPriceAtEntry"
                type="number"
                value={form.mandiPriceAtEntry}
                onChange={handleField}
                className="w-full border p-2 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Expected Price/kg
              </label>
              <input
                name="expectedPricePerKg"
                type="number"
                value={form.expectedPricePerKg}
                onChange={handleField}
                className="w-full border p-2 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              name="location"
              value={form.location}
              onChange={handleField}
              className="w-full border p-2 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white"
            >
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
