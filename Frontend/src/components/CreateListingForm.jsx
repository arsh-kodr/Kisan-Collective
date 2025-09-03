// src/components/CreateListingForm.jsx
import { useState } from "react";
import api from "../api";

const CreateListingForm = ({ onCreated }) => {
  const [form, setForm] = useState({
    crop: "",
    quantityKg: "",
    unit: "kg",
    harvestDate: "",
    mandiPriceAtEntry: "",
    expectedPricePerKg: "",
    location: "",
    photos: [""],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post("/listings", form, { withCredentials: true });
      setSuccess("✅ Listing created successfully!");
      setForm({
        crop: "",
        quantityKg: "",
        unit: "kg",
        harvestDate: "",
        mandiPriceAtEntry: "",
        expectedPricePerKg: "",
        location: "",
        photos: [""],
      });

      if (onCreated) onCreated(res.data.listing);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to create listing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Listing</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Crop */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Crop Name</label>
          <input
            type="text"
            name="crop"
            value={form.crop}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Quantity */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity</label>
            <input
              type="number"
              name="quantityKg"
              value={form.quantityKg}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Unit</label>
            <select
              name="unit"
              value={form.unit}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="kg">Kg</option>
              <option value="quintal">Quintal</option>
              <option value="tonne">Tonne</option>
            </select>
          </div>
        </div>

        {/* Harvest Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Harvest Date</label>
          <input
            type="date"
            name="harvestDate"
            value={form.harvestDate}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Mandi Price (₹)</label>
            <input
              type="number"
              name="mandiPriceAtEntry"
              value={form.mandiPriceAtEntry}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Expected Price per Kg (₹)</label>
            <input
              type="number"
              name="expectedPricePerKg"
              value={form.expectedPricePerKg}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            name="location"
            value={form.location}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Photo (URL)</label>
          <input
            type="text"
            name="photos"
            value={form.photos[0]}
            onChange={(e) => setForm((prev) => ({ ...prev, photos: [e.target.value] }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Buttons */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded-lg shadow hover:bg-green-700 transition disabled:opacity-60"
        >
          {loading ? "Creating..." : "Create Listing"}
        </button>
      </form>

      {error && <p className="text-red-500 mt-3 text-sm">{error}</p>}
      {success && <p className="text-green-600 mt-3 text-sm">{success}</p>}
    </div>
  );
};

export default CreateListingForm;
