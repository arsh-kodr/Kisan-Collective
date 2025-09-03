// src/components/Pagination.jsx
import React from "react";

export default function Pagination({ page = 1, totalPages = 1, onPageChange }) {
  if (totalPages <= 1) return null;

  const prev = () => onPageChange(Math.max(1, page - 1));
  const next = () => onPageChange(Math.min(totalPages, page + 1));

  // show compact range
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);

  for (let p = start; p <= end; p++) pages.push(p);

  return (
    <nav aria-label="Pagination" className="inline-flex items-center gap-2">
      <button
        onClick={prev}
        disabled={page === 1}
        className="px-3 py-1 rounded-md border bg-white text-sm disabled:opacity-50"
      >
        Prev
      </button>

      {start > 1 && (
        <>
          <button onClick={() => onPageChange(1)} className="px-3 py-1 rounded-md border bg-white text-sm">
            1
          </button>
          {start > 2 && <span className="px-2 text-sm">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`px-3 py-1 rounded-md border text-sm ${p === page ? "bg-indigo-600 text-white" : "bg-white"}`}
        >
          {p}
        </button>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-2 text-sm">…</span>}
          <button onClick={() => onPageChange(totalPages)} className="px-3 py-1 rounded-md border bg-white text-sm">
            {totalPages}
          </button>
        </>
      )}

      <button
        onClick={next}
        disabled={page === totalPages}
        className="px-3 py-1 rounded-md border bg-white text-sm disabled:opacity-50"
      >
        Next
      </button>
    </nav>
  );
}
