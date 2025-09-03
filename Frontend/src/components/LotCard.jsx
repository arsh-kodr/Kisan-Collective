// src/components/LotCard.jsx
import React from "react";
import { Link } from "react-router-dom";

/**
 * LotCard: presentational card for a lot
 * Expects `lot` shaped per backend: { _id, name, totalQuantity, basePrice, listings[], fpo: { username }, highestBid }
 */
export default function LotCard({ lot }) {
  const highest = lot.highestBid?.amount ?? null;
  const cropPreview =
    Array.isArray(lot.listings) && lot.listings.length
      ? lot.listings.map((l) => l.crop).slice(0, 2).join(", ")
      : "—";

  return (
    <article className="bg-white rounded-lg shadow-sm p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-900">{lot.name}</h2>
          <span className="text-xs inline-flex items-center px-2 py-0.5 rounded text-white bg-indigo-600">
            {lot.status?.toUpperCase() ?? "OPEN"}
          </span>
        </div>

        <p className="text-sm text-gray-500 mt-1">{cropPreview}</p>

        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-gray-500">Base Price</div>
            <div className="text-base font-medium text-gray-900">₹ {lot.basePrice ?? "—"}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Highest Bid</div>
            <div className="text-base font-medium text-gray-900">
              {highest ? `₹ ${highest}` : "No bids"}
            </div>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-600">
          <div>Quantity: <span className="font-medium">{lot.totalQuantity ?? "—"} kg</span></div>
          <div className="mt-1">FPO: <span className="font-medium">{lot.fpo?.username ?? "—"}</span></div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <Link
          to={`/lots/${lot._id}`}
          className="inline-flex items-center justify-center rounded-md px-4 py-2 border border-transparent bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          View
        </Link>

        <div className="text-xs text-gray-500">
          <div>Listed: {new Date(lot.createdAt).toLocaleDateString()}</div>
        </div>
      </div>
    </article>
  );
}
