import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import PlaceBidForm from "./PlaceBidForm";
import BidsList from "./BidsList";

export default function LotDetail({ currentUser }) {
  const { id } = useParams();
  const [lot, setLot] = useState(null);
  const [highestBid, setHighestBid] = useState(null); // NEW: track highest bid
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLot = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/lots/${id}`, { withCredentials: true });
      setLot(res.data);
      setHighestBid(res.data.highestBid || null); // update highest bid
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

    // Auto-refresh lot details and bids every 10 seconds
    const interval = setInterval(fetchLot, 10000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div className="p-4">Loading lot details...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Lot Details</h2>

      <p className="mb-2">Base Price: ₹{lot?.basePrice}</p>
      <p className="mb-2">Status: {lot?.status}</p>
      <p className="mb-2">FPO: {lot?.fpo?.username || "Unknown"}</p>

      {/* Listings */}
      <div className="mt-4">
        <h3 className="font-semibold">Listings in this Lot</h3>
        {lot?.listings?.length > 0 ? (
          <ul className="list-disc list-inside">
            {lot.listings.map((listing) => (
              <li key={listing._id}>
                {listing.crop} - {listing.quantityKg} {listing.unit} ({listing.status})
              </li>
            ))}
          </ul>
        ) : (
          <p>No listings in this lot</p>
        )}
      </div>

      {/* Current Highest Bid */}
      <p className="mt-4 mb-2">
        Current Highest Bid: {highestBid ? `₹${highestBid.amount}` : "No bids yet"}
      </p>

      {/* Place Bid Form */}
      <div className="mt-6">
        <PlaceBidForm
          lotId={id}
          onBidPlaced={(newBid) => setHighestBid(newBid)} // instant update
        />
      </div>

      {/* Bids List */}
      <div className="mt-6">
        <BidsList lotId={id} highestBid={highestBid} />
      </div>
    </div>
  );
}
