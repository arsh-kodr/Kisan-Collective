// src/pages/MyListings.jsx
import React, { useEffect, useState } from "react";
import api from "../api/api";
import ListingCard from "../components/ListingCard";
import CreateListingForm from "../components/CreateListingForm";
import EditListingModal from "../components/EditListingModal";
import toast from "react-hot-toast";

export default function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // listing being edited
  const [showCreate, setShowCreate] = useState(false);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/listings/me/listings", {
        withCredentials: true,
      });
      setListings(res.data.listings || []);
    } catch (err) {
      console.error("Failed to load listings:", err);
      toast.error(err?.response?.data?.message || "Failed to load listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, []);

  const handleCreated = (newListing) => {
    toast.success("Listing created");
    setShowCreate(false);
    fetchMyListings();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this listing?"))
      return;
    try {
      await api.delete(`/listings/${id}`, { withCredentials: true });
      toast.success("Listing deleted");
      setListings((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error(err?.response?.data?.message || "Delete failed");
    }
  };

  const handleEdit = (listing) => {
    setEditing(listing);
  };

  const handleEdited = (updated) => {
    toast.success("Listing updated");
    setEditing(null);
    fetchMyListings();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create, edit and manage your produce listings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreate((s) => !s)}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-transform transform hover:-translate-y-0.5"
          >
            {showCreate ? "Close" : "Create Listing"}
          </button>
          <button
            onClick={fetchMyListings}
            title="Refresh"
            className="p-2 rounded-lg bg-white border border-gray-200 hover:shadow-sm transition"
          >
            ⟳
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="mb-6 animate-fade-in">
          <CreateListingForm onCreated={handleCreated} />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg p-4 shadow animate-pulse min-h-[140px]"
            />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-gray-600">
            You have no listings yet. Click create to add one.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <ListingCard
              key={listing._id}
              listing={listing}
              onEdit={() => handleEdit(listing)}
              onDelete={() => handleDelete(listing._id)}
              onRefresh={fetchMyListings}
            />
          ))}
        </div>
      )}

      {editing && (
        <EditListingModal
          listing={editing}
          onClose={() => setEditing(null)}
          onSaved={handleEdited}
        />
      )}
    </div>
  );
}
