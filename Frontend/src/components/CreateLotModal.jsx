import { useEffect, useState } from "react";
import api from "../api/api";
import config from "../config/config";

const { apiRoutes } = config;

const UNIT_CONVERSION = {
  kg: 1,
  quintal: 100,
  tonne: 1000,
};

export default function CreateLotModal({ isOpen, onClose, onCreated, initialListingIds = [] }) {
  const [listings, setListings] = useState([]);
  const [selectedListings, setSelectedListings] = useState(initialListingIds || []);
  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [autoCloseTime, setAutoCloseTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        const res = await api.get(apiRoutes.listings.all);
        const all = res.data.listings || [];
        // show only approved listings for selection
        setListings(all.filter((l) => l.status === "approved"));
      } catch (err) {
        console.error("load listings for create lot", err);
      }
    };
    load();
  }, [isOpen]);

  // if parent passed initial listing ids, preselect them
  useEffect(() => {
    if (initialListingIds && initialListingIds.length > 0) {
      setSelectedListings(initialListingIds);
    }
  }, [initialListingIds]);

  // auto-calc basePrice (weighted average per kg)
  useEffect(() => {
    if (!selectedListings || selectedListings.length === 0) {
      setBasePrice("");
      return;
    }
    let totalValue = 0;
    let totalKg = 0;
    selectedListings.forEach((id) => {
      const l = listings.find((x) => x._id === id);
      if (!l) return;
      // handle qty field name variations
      const qty = l.quantityKg ?? l.quantity ?? l.totalQuantity ?? 0;
      const unit = l.unit ?? "kg";
      const qtyKg = Number(qty) * (UNIT_CONVERSION[unit] || 1);
      const pricePerKg = l.expectedPricePerKg ?? l.mandiPriceAtEntry ?? 0;
      totalValue += Number(pricePerKg) * qtyKg;
      totalKg += qtyKg;
    });
    const avg = totalKg > 0 ? Math.round(totalValue / totalKg) : 0;
    setBasePrice(avg);
  }, [selectedListings, listings]);

  const toggleListing = (id) => {
    setSelectedListings((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleSubmit = async () => {
    if (!name) return alert("Please enter lot name");
    if (selectedListings.length === 0) return alert("Select at least one listing");
    setSubmitting(true);
    try {
      const payload = {
        name,
        basePrice: Number(basePrice),
        listings: selectedListings,
        endTime: autoCloseTime || undefined,
      };
      await api.post(apiRoutes.lots.create, payload);
      onCreated && onCreated();
      // reset
      setName("");
      setBasePrice("");
      setSelectedListings([]);
      setAutoCloseTime("");
    } catch (err) {
      console.error("create lot", err);
    } finally {
      setSubmitting(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg">
        <h2 className="text-lg font-bold mb-4">Create Lot</h2>
        <label className="block text-sm mb-1">Lot Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2 mb-3" placeholder="e.g. Wheat Lot Sept 2025" />

        <label className="block text-sm mb-1">Base Price (₹ per kg) — auto-calculated but editable</label>
        <input value={basePrice} onChange={(e) => setBasePrice(e.target.value)} type="number" className="w-full border rounded-lg px-3 py-2 mb-3" />

        <label className="block text-sm mb-1">Auto close time (optional)</label>
        <input value={autoCloseTime} onChange={(e) => setAutoCloseTime(e.target.value)} type="datetime-local" className="w-full border rounded-lg px-3 py-2 mb-3" />

        <label className="block text-sm mb-2">Select Listings (approved)</label>
        <div className="max-h-40 overflow-y-auto border rounded-lg p-2 mb-3">
          {listings.length === 0 ? (
            <p className="text-sm text-gray-500">No approved listings available</p>
          ) : (
            listings.map((l) => (
              <label key={l._id} className="flex items-center gap-2 py-1 cursor-pointer">
                <input type="checkbox" checked={selectedListings.includes(l._id)} onChange={() => toggleListing(l._id)} />
                <span className="text-sm">{l.crop} — {l.quantityKg ?? l.quantity ?? l.totalQuantity ?? 0} {l.unit ?? "kg"}</span>
              </label>
            ))
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border text-sm text-gray-600">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm">
            {submitting ? "Creating..." : "Create Lot"}
          </button>
        </div>
      </div>
    </div>
  );
}
