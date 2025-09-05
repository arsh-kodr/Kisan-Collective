// src/components/fpo/Listings.jsx
import React, { useEffect, useState } from "react";
import listingApi from "../../api/listing";
import toast from "react-hot-toast";

const Listings = () => {
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(true);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const [pendingData, approvedData] = await Promise.all([
        listingApi.getPendingListings(),
        listingApi.getListings(),
      ]);
      setPending(pendingData);
      setApproved(approvedData);
    } catch (err) {
      console.error("Error fetching listings:", err);
      toast.error("Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleApprove = async (id) => {
    try {
      await listingApi.approveListing(id);
      setPending((prev) => prev.filter((l) => l._id !== id));

      const updatedApproved = await listingApi.getListings();
      setApproved(updatedApproved);

      toast.success("Listing approved");
    } catch {
      toast.error("Failed to approve listing");
    }
  };

  const handleReject = async (id) => {
    try {
      await listingApi.rejectListing(id);
      setPending((prev) => prev.filter((l) => l._id !== id));
      toast.success("Listing rejected");
    } catch {
      toast.error("Failed to reject listing");
    }
  };

  const data = activeTab === "pending" ? pending : approved;

  if (loading) return <p>Loading...</p>;

  return (
    <div className="bg-white rounded-xl shadow p-6">
      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b">
        <button
          className={`pb-2 ${
            activeTab === "pending"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("pending")}
        >
          Pending
        </button>
        <button
          className={`pb-2 ${
            activeTab === "approved"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("approved")}
        >
          Approved
        </button>
      </div>

      {/* Listings */}
      {data.length === 0 ? (
        <div className="text-center text-gray-500 text-sm py-6">
          No {activeTab} listings
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {data.map((listing) => (
            <li
              key={listing._id}
              className="flex justify-between items-center py-3 flex-wrap gap-2"
            >
              <div>
                <p className="font-medium text-gray-800">{listing.crop}</p>
                <p className="text-xs text-gray-500">
                  {listing.quantityKg} kg · {listing.location}
                </p>
              </div>
              {activeTab === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(listing._id)}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded-lg"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(listing._id)}
                    className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded-lg"
                  >
                    Reject
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Listings;
