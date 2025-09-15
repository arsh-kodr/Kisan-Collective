// src/pages/BrowseLots.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  X,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
  Users,
  Wheat,
  IndianRupee,
} from "lucide-react";
import api from "../api/api";
import config from "../config/config";

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
const LotCard = ({ lot }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-green-200 transform hover:-translate-y-1 ${
        isHovered ? "shadow-lg" : "shadow-sm"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
            <span className="text-xs text-gray-500">{lot.timeLeft || "—"}</span>
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
          <button className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200">
            Place Bid
          </button>
          <button className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200">
            View Details
          </button>
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
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3 py-2 rounded-lg transition-colors ${
            p === page
              ? "bg-green-600 text-white"
              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  );
};

const DEFAULT_LIMIT = 12;

export default function BrowseLots() {
  // state
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);
  const [totalPages, setTotalPages] = useState(1);

  const [crop, setCrop] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("-createdAt");

  // debounced values
  const debouncedCrop = useDebounce(crop, 350);
  const debouncedMinPrice = useDebounce(minPrice, 350);
  const debouncedMaxPrice = useDebounce(maxPrice, 350);

  // crop options from fetched lots
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

  // query params builder
  const buildParams = () => {
    const p = { status: "open", page, limit, sort };
    if (debouncedCrop) p.crop = debouncedCrop;
    if (debouncedMinPrice !== "") p.minPrice = debouncedMinPrice;
    if (debouncedMaxPrice !== "") p.maxPrice = debouncedMaxPrice;
    return p;
  };

  // fetch lots
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
        console.log(res.data);

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
            basePrice: lot.basePrice, // ₹/kg
            bidCount: lot.highestBid ? 1 : 0,
            highestBid: lot.highestBid?.amount || 0, // if you want to show it later
            totalQuantity: lot.totalQuantity,
          }))
        );

        const meta = res.data.pagination || {};
        setPage(meta.page || 1);
        setTotalPages(meta.totalPages || 1);
      } catch (err) {
        if (cancelled) return;
        console.error("BrowseLots fetch error:", err);
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

  const onClearFilters = () => {
    setCrop("");
    setMinPrice("");
    setMaxPrice("");
    setSort("-createdAt");
    setPage(1);
  };

  const hasActiveFilters =
    crop || minPrice || maxPrice || sort !== "-createdAt";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Browse Open Lots
                </h1>
                <p className="text-gray-600 flex items-center">
                  <Wheat className="w-4 h-4 mr-2" />
                  Find produce lots from verified FPOs. Filter, sort and place
                  bids.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600 bg-white px-3 py-2 rounded-lg border">
                  <span className="font-medium text-green-600">
                    {lots.length}
                  </span>{" "}
                  lots available
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    showFilters || hasActiveFilters
                      ? "bg-green-600 text-white border-green-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="bg-white text-green-600 text-xs px-1.5 py-0.5 rounded-full font-medium">
                      {
                        [
                          crop,
                          minPrice,
                          maxPrice,
                          sort !== "-createdAt" ? "sorted" : null,
                        ].filter(Boolean).length
                      }
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Filters Panel */}
          {showFilters && (
            <div className="mb-8 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Filter & Sort
                  </h3>
                  <button
                    onClick={() => setShowFilters(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Crop Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Crop Type
                    </label>
                    <select
                      value={crop}
                      onChange={(e) => {
                        setPage(1);
                        setCrop(e.target.value);
                      }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    >
                      <option value="">All crops</option>
                      <option value="wheat">Wheat</option>
                      <option value="wheat">Rice</option>
                      <option value="wheat">Bajra</option>
                      <option value="wheat">Corn</option>
                      {cropOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Min Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 10,000"
                      value={minPrice}
                      onChange={(e) => {
                        setPage(1);
                        setMinPrice(e.target.value);
                      }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>

                  {/* Max Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Price (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 50,000"
                      value={maxPrice}
                      onChange={(e) => {
                        setPage(1);
                        setMaxPrice(e.target.value);
                      }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    />
                  </div>

                  {/* Sort */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort By
                    </label>
                    <select
                      value={sort}
                      onChange={(e) => {
                        setPage(1);
                        setSort(e.target.value);
                      }}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    >
                      <option value="-createdAt">
                        <Calendar className="w-4 h-4 mr-2 inline" />
                        Newest First
                      </option>
                      <option value="basePrice">
                        <TrendingUp className="w-4 h-4 mr-2 inline" />
                        Price: Low to High
                      </option>
                      <option value="-basePrice">
                        <TrendingDown className="w-4 h-4 mr-2 inline" />
                        Price: High to Low
                      </option>
                    </select>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    {hasActiveFilters && (
                      <span className="inline-flex items-center gap-1 text-green-600">
                        <Filter className="w-4 h-4" />
                        Filters applied
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPage(1)}
                      className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                    {hasActiveFilters && (
                      <button
                        onClick={onClearFilters}
                        className="flex items-center gap-2 px-4 py-2 text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          <div>
            {loading ? (
              // Enhanced skeleton loading
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: limit }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="h-5 bg-gray-200 rounded w-3/4" />
                          <div className="h-4 bg-gray-200 rounded w-1/2" />
                          <div className="h-4 bg-gray-200 rounded w-2/3" />
                        </div>
                        <div className="h-6 bg-gray-200 rounded-full w-16" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4" />
                        <div className="h-8 bg-gray-200 rounded w-1/2" />
                      </div>
                      <div className="flex gap-3">
                        <div className="h-10 bg-gray-200 rounded-lg flex-1" />
                        <div className="h-10 bg-gray-200 rounded-lg w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                <div className="text-red-600 text-lg font-medium mb-2">
                  Oops! Something went wrong
                </div>
                <p className="text-red-700">{error}</p>
                <button
                  onClick={() => setPage(1)}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : lots.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
                <Wheat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No lots found
                </h3>
                <p className="text-gray-600 mb-4">
                  No lots match your current filters. Try adjusting your search
                  criteria.
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={onClearFilters}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                  {lots.map((lot) => (
                    <LotCard key={lot._id} lot={lot} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center">
                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      onPageChange={(p) => setPage(p)}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
