// src/pages/LotDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import { socket } from "../socket";   // 👈 import socket
import PlaceBidForm from "../components/PlaceBidForm";
import BidsList from "../components/BidsList";

export default function LotDetail() {
  const { id } = useParams();
  const [lot, setLot] = useState(null);
  const [highestBid, setHighestBid] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLot = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/lots/${id}`, { withCredentials: true });
      setLot(res.data);
      setHighestBid(res.data.highestBid || null);
      setError(null);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) setError("Lot not found");
      else setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLot();

    // join socket room
    socket.emit("join:lot", id);

    // handle new bids
    socket.on(`bid:new:${id}`, (bid) => {
      setHighestBid(bid);
    });

    // handle auction close
    socket.on(`lot:closed:${id}`, (data) => {
      setLot((prev) => ({ ...prev, status: "sold", winningBid: data.winningBid }));
    });

    return () => {
      socket.emit("leave:lot", id);
      socket.off(`bid:new:${id}`);
      socket.off(`lot:closed:${id}`);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-gray-600 animate-pulse">Loading lot details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-600">
        <p>{error}</p>
        <Link to="/lots" className="text-blue-600 underline mt-2 inline-block">
          Back to Lots
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white shadow rounded-2xl p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center border-b pb-4 mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
          {lot?.name}
        </h2>
        <span
          className={`mt-2 md:mt-0 px-3 py-1 text-sm rounded-full font-medium ${
            lot?.status === "open"
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {lot?.status?.toUpperCase()}
        </span>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-500">Base Price</p>
          <p className="font-semibold text-gray-800">₹{lot?.basePrice}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Total Quantity</p>
          <p className="font-semibold text-gray-800">{lot?.totalQuantity} kg</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">FPO</p>
          <p className="font-semibold text-gray-800">
            {lot?.fpo?.username || "Unknown"}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Current Highest Bid</p>
          <p className="font-semibold text-gray-800">
            {highestBid ? `₹${highestBid.amount}` : "No bids yet"}
          </p>
        </div>
      </div>

      {/* Listings */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Listings in this Lot
        </h3>
        {lot?.listings?.length > 0 ? (
          <ul className="space-y-2">
            {lot.listings.map((listing) => (
              <li
                key={listing._id}
                className="border rounded-lg p-3 text-sm text-gray-700 flex justify-between"
              >
                <span>
                  {listing.crop} - {listing.quantityKg} {listing.unit}
                </span>
                <span className="text-gray-500">({listing.status})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No listings in this lot.</p>
        )}
      </div>

      {/* Place Bid */}
      {lot?.status === "open" && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Place Your Bid
          </h3>
          <PlaceBidForm
            lotId={id}
            onBidPlaced={(newBid) => setHighestBid(newBid)}
          />
        </div>
      )}

      {/* Bids List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Bids</h3>
        <BidsList lotId={id} />
      </div>
    </div>
  );
}
