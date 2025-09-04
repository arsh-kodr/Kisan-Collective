import { useEffect, useState } from "react";
import listingApi from "../api/listing";
import toast from "react-hot-toast";

export default function PendingListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch pending listings on mount
  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await listingApi.getPendingListings();
      setListings(res.data.listings || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch pending listings");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await listingApi.approveListing(id);
      toast.success("Listing approved ✅");
      setListings((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Approval failed");
    }
  };

  const handleReject = async (id) => {
    try {
      await listingApi.rejectListing(id);
      toast.error("Listing rejected ❌");
      setListings((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Rejection failed");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="animate-pulse text-gray-500">Loading pending listings...</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-20 text-gray-600">
        <p>No pending listings found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Pending Listings for Approval</h2>

      <div className="space-y-4">
        {listings.map((listing) => (
          <div
            key={listing._id}
            className="border rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4"
          >
            {/* Listing Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {listing.crop} ({listing.quantityKg} {listing.unit})
              </h3>
              <p className="text-sm text-gray-600">
                Harvest: {new Date(listing.harvestDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">
                Farmer: {listing.createdBy?.username || "Unknown"}
              </p>
              {listing.location && (
                <p className="text-sm text-gray-600">📍 {listing.location}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(listing._id)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(listing._id)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
