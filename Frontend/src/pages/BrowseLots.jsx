// src/pages/BrowseLots.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  X,
  Calendar,
  MapPin,
  Users,
  Wheat,
  IndianRupee,
} from "lucide-react";
import api from "../api/api";
import config from "../config/config";
import { useNavigate } from "react-router-dom";

// shadcn/ui
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// Lot Card Component
const LotCard = ({ lot, onViewDetails }) => {
  const navigate = useNavigate();
  return (
    <div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-green-200 transform hover:-translate-y-1"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">
              {lot.title}
            </h3>
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              {lot.location}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Users className="w-4 h-4 mr-1" />
              {lot.fpoName}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-2">
              {lot.quality}
            </span>
            <span className="text-xs text-gray-500">
              {lot.timeLeft || "—"}
            </span>
          </div>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Base Price</p>
              <div className="flex items-center">
                <IndianRupee className="w-5 h-5 text-green-600 mr-1" />
                <span className="text-2xl font-bold text-gray-900">
                  {lot.basePrice?.toLocaleString("en-IN")}
                </span>
                <span className="text-sm text-gray-600 ml-1">/kg</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Total Bids</p>
              <span className="text-lg font-semibold text-blue-600">
                {lot.bidCount ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={() => navigate("/bidList")}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            Place Bid
          </Button>
          <Button
            variant="outline"
            onClick={() => onViewDetails(lot)}
          >
            View Details
          </Button>
        </div>
      </div>
    </div>
  );
};

// Pagination Component
const Pagination = ({ page, totalPages, onPageChange }) => {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center space-x-2">
      <Button
        variant="outline"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        Previous
      </Button>

      {pages.map((p) => (
        <Button
          key={p}
          variant={p === page ? "default" : "outline"}
          onClick={() => onPageChange(p)}
        >
          {p}
        </Button>
      ))}

      <Button
        variant="outline"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
      >
        Next
      </Button>
    </div>
  );
};

const DEFAULT_LIMIT = 12;

export default function BrowseLots() {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);
  const [totalPages, setTotalPages] = useState(1);

  const [crop, setCrop] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("-createdAt");

  const [selectedLot, setSelectedLot] = useState(null);

  const debouncedCrop = useDebounce(crop, 350);
  const debouncedMinPrice = useDebounce(minPrice, 350);
  const debouncedMaxPrice = useDebounce(maxPrice, 350);

  const cropOptions = useMemo(() => {
    const set = new Set();
    lots.forEach((l) => {
      if (Array.isArray(l.listings)) {
        l.listings.forEach((t) => {
          if (t && t.crop) set.add(t.crop);
        });
      }
    });
    return Array.from(set).sort();
  }, [lots]);

  const buildParams = () => {
    const p = { status: "open", page, limit, sort };
    if (debouncedCrop) p.crop = debouncedCrop;
    if (debouncedMinPrice !== "") p.minPrice = debouncedMinPrice;
    if (debouncedMaxPrice !== "") p.maxPrice = debouncedMaxPrice;
    return p;
  };

  useEffect(() => {
    let cancelled = false;
    async function fetchLots() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(config.apiRoutes.lots.all, {
          params: buildParams(),
        });
        if (cancelled) return;

        setLots(
          (res.data.lots || []).map((lot) => ({
            _id: lot._id,
            title: lot.name,
            location: lot.location || "Unknown",
            fpoName: lot.fpo?.username || "N/A",
            quality: lot.status || "—",
            timeLeft: lot.createdAt
              ? new Date(lot.createdAt).toLocaleDateString()
              : "—",
            basePrice: lot.basePrice,
            bidCount: lot.highestBid ? 1 : 0,
            highestBid: lot.highestBid?.amount || 0,
            totalQuantity: lot.totalQuantity,
            listings: lot.listings || [],
          }))
        );

        const meta = res.data.pagination || {};
        setPage(meta.page || 1);
        setTotalPages(meta.totalPages || 1);
      } catch (err) {
        if (cancelled) return;
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load lots. Please try again."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchLots();
    return () => {
      cancelled = true;
    };
  }, [page, limit, debouncedCrop, debouncedMinPrice, debouncedMaxPrice, sort]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Browse Open Lots
          </h1>
          <p className="text-gray-600 flex items-center">
            <Wheat className="w-4 h-4 mr-2" />
            Find produce lots from verified FPOs. Filter, sort and place bids.
          </p>
        </div>

        {/* Results */}
        <div>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : lots.length === 0 ? (
            <p>No lots found</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {lots.map((lot) => (
                  <LotCard
                    key={lot._id}
                    lot={lot}
                    onViewDetails={(l) => setSelectedLot(l)}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={(p) => setPage(p)}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Lot Details Modal */}
      <Dialog open={!!selectedLot} onOpenChange={() => setSelectedLot(null)}>
        <DialogContent className="max-w-2xl">
          {selectedLot && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedLot.title}</DialogTitle>
                <DialogDescription>
                  Location: {selectedLot.location} • FPO:{" "}
                  {selectedLot.fpoName}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-3">
                <p>
                  <span className="font-medium">Base Price:</span>{" "}
                  ₹{selectedLot.basePrice?.toLocaleString("en-IN")} /kg
                </p>
                <p>
                  <span className="font-medium">Quantity:</span>{" "}
                  {selectedLot.totalQuantity} kg
                </p>
                <p>
                  <span className="font-medium">Bids:</span>{" "}
                  {selectedLot.bidCount}
                </p>

                {/* Listings */}
                <div>
                  <h4 className="font-semibold mb-2">Included Listings:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                    {selectedLot.listings.map((listing) => (
                      <li key={listing._id}>
                        {listing.crop} — {listing.quantity}kg @ ₹
                        {listing.price}/kg
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setSelectedLot(null)}>
                  Close
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  Place Bid
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
