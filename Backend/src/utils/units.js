// small utility for unit normalization across the codebase
const UNIT_CONVERSION = { kg: 1, quintal: 100, tonne: 1000 };

function qtyToKg(quantity = 0, unit = "kg") {
  const conv = UNIT_CONVERSION[unit] || 1;
  return (quantity || 0) * conv;
}

module.exports = {
  qtyToKg,
  UNIT_CONVERSION,
};
