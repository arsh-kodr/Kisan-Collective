import React, { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/api";
import { socket } from "../socket";
import PlaceBidForm from "../components/PlaceBidForm";
import BidsList from "../components/BidsList";
import LotCountdownBar from "../components/LotCountdown";
import { AuthContext } from "../contexts/AuthContext";
import toast from "react-hot-toast";

export default function LotDetail() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [lot, setLot] = useState(null);
  const [highestBid, setHighestBid] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch lot details
  const fetchLot = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/lots/${id}`, { withCredentials: true });
      setLot(res.data);
      setHighestBid(res.data.highestBid || null);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err.response?.status === 404 ? "Lot not found" : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLot();

    // Join socket room for real-time updates
    socket.emit("join:lot", id);

    // Listen for new bids
    socket.on(`bid:new:${id}`, (bid) => setHighestBid(bid));

    // Listen for auction closed
    socket.on(`lot:closed:${id}`, (data) => {
      setLot((prev) => ({
        ...prev,
        status: "closed",
        winningBid: data.winningBid,
      }));

      // Notify user if they won
      if (data.winningBid?.bidder?._id === user?._id) {
        toast.success("🎉 You won this auction! Pay now to confirm your order.");
      }
    });

    return () => {
      socket.emit("leave:lot", id);
      socket.off(`bid:new:${id}`);
      socket.off(`lot:closed:${id}`);
    };
  }, [id, user]);

  if (loading)
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-gray-600 animate-pulse">Loading lot details...</p>
      </div>
    );

  if (error)
    return (
      <div className="p-6 text-center text-red-600">
        <p>{error}</p>
        <Link to="/lots" className="text-blue-600 underline mt-2 inline-block">
          Back to Lots
        </Link>
      </div>
    );

  const isClosed = lot?.status !== "open";
  const isHighestBidder = highestBid?.bidder?._id === user?._id;

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-6 md:p-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center border-b pb-4 mb-6 gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{lot?.name}</h2>

        <span
          className={`px-3 py-1 text-sm rounded-full font-medium ${
            lot?.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
          }`}
        >
          {lot?.status?.toUpperCase()}
        </span>
      </div>

      {/* Countdown / Timer */}
      {lot.status === "open" && lot.endTime && (
        <LotCountdownBar
          lotId={id}
          endTime={lot.endTime}
          onEnd={() => setLot((prev) => ({ ...prev, status: "closed" }))}
        />
      )}

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
          <p className="font-semibold text-gray-800">{lot?.fpo?.username || "Unknown"}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Current Highest Bid</p>
          <p className="font-semibold text-gray-800">{highestBid ? `₹${highestBid.amount}` : "No bids yet"}</p>
        </div>
      </div>

      {/* Listings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Listings in this Lot</h3>
        {lot?.listings?.length > 0 ? (
          <ul className="space-y-2">
            {lot.listings.map((listing) => (
              <li key={listing._id} className="border rounded-lg p-3 text-sm text-gray-700 flex justify-between">
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
      {!isClosed ? (
        <PlaceBidForm
          lotId={id}
          lotBasePrice={lot?.basePrice}
          onBidPlaced={(newBid) => setHighestBid(newBid)}
          currentUserId={user?._id}
        />
      ) : (
        <div className="mb-8 p-4 bg-gray-100 rounded-lg text-gray-700">
          <p>Auction closed. Winning bid: {lot.winningBid ? `₹${lot.winningBid.amount}` : "No bids placed"}</p>
        </div>
      )}

      {/* Bids List */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Bids</h3>
        <BidsList lotId={id} winningBidId={lot?.winningBid?._id} />
      </div>
    </div>
  );
}
