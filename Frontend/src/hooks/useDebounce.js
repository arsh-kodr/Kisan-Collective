// src/hooks/useDebounce.js
import { useEffect, useState } from "react";

/**
 * returns a debounced value that updates after `delay` ms of inactivity
 */
export default function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
