// src/components/ListingCard.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function ListingCard({ listing, onEdit, onDelete, onRefresh }) {
  const statusColor = {
    open: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    pooled: "bg-indigo-100 text-indigo-800",
    sold: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700",
  }[listing.status] || "bg-gray-100 text-gray-700";

  return (
    <article className="bg-white rounded-2xl shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-transform transform hover:-translate-y-1">
      <div>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-gray-900">{listing.crop}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
            {listing.status}
          </span>
        </div>

        <p className="text-sm text-gray-600 mt-1">{listing.location || "Location not set"}</p>

        <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-700">
          <div>
            <div className="text-xs text-gray-500">Quantity</div>
            <div className="font-medium">{listing.quantityKg} {listing.unit}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Harvest date</div>
            <div className="font-medium">{new Date(listing.harvestDate).toLocaleDateString()}</div>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          <div>Expected: {listing.expectedPricePerKg ? `₹${listing.expectedPricePerKg}/kg` : "—"}</div>
          <div className="mt-1">Mandi price: {listing.mandiPriceAtEntry ? `₹${listing.mandiPriceAtEntry}` : "—"}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="px-3 py-1 rounded-md border border-gray-200 bg-white text-sm hover:bg-gray-50 transition"
            aria-label="Edit listing"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 rounded-md border border-red-200 bg-red-50 text-sm text-red-700 hover:bg-red-100 transition"
            aria-label="Delete listing"
          >
            Delete
          </button>
        </div>

        <div className="text-xs text-gray-500">
          <div>Created: {new Date(listing.createdAt).toLocaleDateString()}</div>
        </div>
      </div>
    </article>
  );
}
