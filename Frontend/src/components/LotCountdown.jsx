import { useEffect, useState } from "react";
import { socket } from "../socket";

export default function LotCountdown({ lotId, endTime, onEnd }) {
  const [timeLeft, setTimeLeft] = useState(Math.max(new Date(endTime) - new Date(), 0));
  const [ended, setEnded] = useState(false); // to prevent multiple emits

  useEffect(() => {
    if (ended) return;

    const interval = setInterval(() => {
      const diff = Math.max(new Date(endTime) - new Date(), 0);
      setTimeLeft(diff);

      if (diff <= 0) {
        clearInterval(interval);
        setEnded(true); // mark as ended

        onEnd?.(); // callback to update UI

        // Emit socket event only once
        if (lotId) {
          socket.emit("lot:ended", { lotId });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onEnd, lotId, ended]);

  if (timeLeft <= 0) {
    return <span className="text-red-600 font-semibold">Auction ended</span>;
  }

  const hours = String(Math.floor(timeLeft / (1000 * 60 * 60))).padStart(2, "0");
  const minutes = String(Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, "0");
  const seconds = String(Math.floor((timeLeft % (1000 * 60)) / 1000)).padStart(2, "0");

  return <span className="text-green-700 font-semibold">{hours}:{minutes}:{seconds}</span>;
}
