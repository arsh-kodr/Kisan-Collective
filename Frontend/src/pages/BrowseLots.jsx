// src/pages/BrowseLots.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../api";
import LotCard from "../components/LotCard";
import Pagination from "../components/Pagination";
import useDebounce from "../hooks/useDebounce";

const DEFAULT_LIMIT = 12;

export default function BrowseLots() {
  // filters & UI state
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);
  const [totalPages, setTotalPages] = useState(1);

  const [crop, setCrop] = useState(""); // simple text filter (populated via dropdown)
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("-createdAt");

  // for text debounce (so price/crop typing won't fire immediate requests)
  const debouncedCrop = useDebounce(crop, 350);
  const debouncedMinPrice = useDebounce(minPrice, 350);
  const debouncedMaxPrice = useDebounce(maxPrice, 350);

  // derive crop options from current lots (first load) — keeps UI simple and offline-friendly
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

  // Build query params
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
        const res = await api.get("/lots", { params: buildParams() });
        if (cancelled) return;
        setLots(res.data.lots || []);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedCrop, debouncedMinPrice, debouncedMaxPrice, sort]);

  // helpers
  const onClearFilters = () => {
    setCrop("");
    setMinPrice("");
    setMaxPrice("");
    setSort("-createdAt");
    setPage(1);
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
          Browse Open Lots
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Find produce lots from verified FPOs. Filter, sort and place bids.
        </p>
      </header>

      {/* Filters */}
      <section className="mb-6 bg-white rounded-lg p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Crop
            </label>
            <select
              value={crop}
              onChange={(e) => {
                setPage(1);
                setCrop(e.target.value);
              }}
              className="w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            >
              <option value="">All crops</option>
              {/* populate dropdown from cropOptions (derived from loaded lots) */}
              {cropOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Min Price
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 1000"
              value={minPrice}
              onChange={(e) => {
                setPage(1);
                setMinPrice(e.target.value);
              }}
              className="w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Max Price
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 20000"
              value={maxPrice}
              onChange={(e) => {
                setPage(1);
                setMaxPrice(e.target.value);
              }}
              className="w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Sort
            </label>
            <select
              value={sort}
              onChange={(e) => {
                setPage(1);
                setSort(e.target.value);
              }}
              className="w-full rounded-md border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
            >
              <option value="-createdAt">Newest</option>
              <option value="basePrice">Price: Low → High</option>
              <option value="-basePrice">Price: High → Low</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{lots.length}</span> lots
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPage(1);
              }}
              className="px-3 py-1 rounded-md bg-gray-100 text-sm text-gray-700 hover:bg-gray-200"
            >
              Refresh
            </button>
            <button
              onClick={onClearFilters}
              className="px-3 py-1 rounded-md bg-white border border-gray-200 text-sm text-gray-700 hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>
      </section>

      {/* Results */}
      <section>
        {loading ? (
          // skeleton grid
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: limit }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg bg-white p-4 shadow animate-pulse min-h-[180px]"
              >
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/3 mb-6" />
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 rounded w-20" />
                  <div className="h-8 bg-gray-200 rounded w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-red-800">{error}</div>
        ) : lots.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-gray-600 text-center shadow">
            No lots found matching your filters.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {lots.map((lot) => (
                <LotCard key={lot._id} lot={lot} />
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={(p) => setPage(p)}
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
