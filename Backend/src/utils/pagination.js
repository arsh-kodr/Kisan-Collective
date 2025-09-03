// src/utils/pagination.js
function parseIntOrDefault(val, def) {
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? def : n;
}

function getPagination(query = {}) {
  const page = Math.max(parseIntOrDefault(query.page, 1), 1);
  const limit = Math.min(Math.max(parseIntOrDefault(query.limit, 10), 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Accepts sort string:
 *  - '-createdAt' or 'basePrice' or 'basePrice,-createdAt'
 * Returns a sort object for aggregation $sort.
 */
function parseSort(sortStr = '-createdAt') {
  const parts = String(sortStr).split(',').map(s => s.trim()).filter(Boolean);
  if (!parts.length) return { createdAt: -1 };

  const out = {};
  for (const p of parts) {
    if (p.startsWith('-')) out[p.slice(1)] = -1;
    else out[p] = 1;
  }
  return out;
}

function escapeRegex(s = '') {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { getPagination, parseSort, escapeRegex };
