// src/pages/MyListings.jsx
import React, { useEffect, useState } from "react";
import api from "../api/api";
import ListingCard from "../components/ListingCard";
import CreateListingForm from "../components/CreateListingForm";
import EditListingModal from "../components/EditListingModal";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { RefreshCw, PlusCircle, X } from "lucide-react";

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

  const handleCreated = () => {
    toast.success("Listing created");
    setShowCreate(false);
    fetchMyListings();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
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

  const handleEdited = () => {
    toast.success("Listing updated");
    setEditing(null);
    fetchMyListings();
  };

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-green-700">
            My Listings
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your produce — create, edit, and organize your listings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowCreate((s) => !s)}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow"
          >
            {showCreate ? (
              <>
                <X className="w-4 h-4" /> Close
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" /> Create Listing
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchMyListings}
            title="Refresh"
            className="rounded-lg border-gray-300"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {showCreate && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="p-6 shadow-md rounded-xl">
            <CreateListingForm onCreated={handleCreated} />
          </Card>
        </motion.div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 shadow animate-pulse min-h-[140px]"
            />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <Card className="p-8 text-center shadow-md rounded-xl">
          <p className="text-gray-600">
            You have no listings yet. Click{" "}
            <span className="font-semibold text-green-700">Create Listing</span>{" "}
            to add one.
          </p>
        </Card>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {listings.map((listing) => (
            <ListingCard
              key={listing._id}
              listing={listing}
              onEdit={() => handleEdit(listing)}
              onDelete={() => handleDelete(listing._id)}
              onRefresh={fetchMyListings}
            />
          ))}
        </motion.div>
      )}

      {/* Edit Modal */}
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
