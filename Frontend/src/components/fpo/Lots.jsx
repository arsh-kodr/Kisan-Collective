import React, { useState, useEffect } from "react";
import lotApi from "../../api/lotApi";
import CreateLotModal from "./CreateLotModal";
import LotDetailsModal from "./LotDetailsModal";
import toast from "react-hot-toast";
import { socket } from "../../socket"; 

const Lots = () => {
  const [showModal, setShowModal] = useState(false);
  const [detailsLot, setDetailsLot] = useState(null);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLots = async () => {
    try {
      const res = await lotApi.getMyLots();
      setLots(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch lots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLots();

    // ✅ Listen for real-time lot events
    socket.on("lot:closed", (lotId) => {
      setLots((prev) =>
        prev.map((lot) =>
          lot._id === lotId ? { ...lot, status: "closed" } : lot
        )
      );
      toast("Auction closed for a lot!", { icon: "🔒" });
    });

    socket.on("lot:new", (newLot) => {
      setLots((prev) => [newLot, ...prev]);
      toast.success("New lot created");
    });

    return () => {
      socket.off("lot:closed");
      socket.off("lot:new");
    };
  }, []);

  if (loading)
    return <p className="animate-pulse text-gray-500">Loading lots...</p>;

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-gray-800">My Lots</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow"
        >
          Create Lot
        </button>
      </div>

      {lots.length === 0 ? (
        <p className="text-gray-500 text-sm">No lots created yet</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {lots.map((lot) => (
            <li
              key={lot._id}
              className="flex justify-between items-center py-3 flex-wrap gap-2"
            >
              <div>
                <p className="font-medium">{lot.name}</p>
                <p className="text-xs text-gray-500">
                  {lot.listings.length} listings · {lot.totalQuantity} kg
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    lot.status === "open"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {lot.status}
                </span>
                <button
                  onClick={() => setDetailsLot(lot)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  View Details
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showModal && (
        <CreateLotModal
          onClose={() => {
            setShowModal(false);
            fetchLots();
          }}
        />
      )}

      {detailsLot && (
        <LotDetailsModal
          lot={detailsLot}
          onClose={() => setDetailsLot(null)}
          refresh={fetchLots}
        />
      )}
    </div>
  );
};

export default Lots;
