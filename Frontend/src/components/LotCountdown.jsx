import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { socket } from "../socket";

export default function LotCountdownBar({ lotId, endTime, onEnd }) {
  const [timeLeft, setTimeLeft] = useState(Math.max(new Date(endTime) - new Date(), 0));
  const [ended, setEnded] = useState(false);

  useEffect(() => {
    if (ended) return;

    const interval = setInterval(() => {
      const diff = Math.max(new Date(endTime) - new Date(), 0);
      setTimeLeft(diff);

      if (diff <= 0) {
        clearInterval(interval);
        setEnded(true);
        onEnd?.();
        if (lotId) socket.emit("lot:ended", { lotId });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, onEnd, lotId, ended]);

  const totalDuration = new Date(endTime) - new Date();
  const percentLeft = Math.max(timeLeft / totalDuration, 0);

  // Determine color dynamically
  let bgColor = "bg-green-500";
  if (percentLeft < 0.3) bgColor = "bg-red-500";
  else if (percentLeft < 0.6) bgColor = "bg-yellow-500";

  // Time label
  const hours = Math.floor(timeLeft / 3600000);
  const minutes = Math.floor((timeLeft % 3600000) / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  const timeLabel =
    hours > 0
      ? `${hours}h ${minutes}m ${seconds}s`
      : minutes > 0
      ? `${minutes}m ${seconds}s`
      : `${seconds}s`;

  return (
    <div className="w-full flex flex-col gap-1">
      <div className="flex justify-between items-center text-sm font-medium text-gray-700">
        <span>Time Left:</span>
        <span className={`${percentLeft <= 0.3 ? "text-red-600" : percentLeft <= 0.6 ? "text-yellow-600" : "text-green-600"}`}>
          {timeLabel}
        </span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-3 rounded-full ${bgColor}`}
          initial={{ width: "100%" }}
          animate={{ width: `${percentLeft * 100}%` }}
          transition={{ ease: "linear", duration: 1 }}
        />
      </div>
    </div>
  );
}
