// src/api/listing.js
import api from "./api";

const listingApi = {
  // Farmer Endpoints
  getMyListings: async () => {
    const res = await api.get("/listings/me/listings");
    return res.data.listings || [];
  },
  createListing: async (data) => {
    const res = await api.post("/listings", data);
    return res.data.listing;
  },
  updateListing: async (id, data) => {
    const res = await api.put(`/listings/${id}`, data);
    return res.data.listing;
  },
  deleteListing: async (id) => {
    const res = await api.delete(`/listings/${id}`);
    return res.data;
  },

  // Common (Farmer + FPO + Buyer)
  getListings: async () => {
    const res = await api.get("/listings");
    return res.data.listings || [];
  },
  getListingById: async (id) => {
    const res = await api.get(`/listings/${id}`);
    return res.data.listing;
  },

  // Alias for clarity
  getOpenListings: async () => {
    const res = await api.get("/listings/open");
    return res.data || [];
  },

  // FPO Endpoints
  getPendingListings: async () => {
    const res = await api.get("/listings/pending");
    return res.data.listings || [];
  },
  getFarmerListings: async (farmerId) => {
    const res = await api.get(`/listings/farmer/${farmerId}`);
    return res.data.listings || [];
  },
  approveListing: async (id) => {
    const res = await api.put(`/listings/${id}/approve`);
    return res.data.listing;
  },
  rejectListing: async (id) => {
    const res = await api.put(`/listings/${id}/reject`);
    return res.data.listing;
  },
};

export default listingApi;
