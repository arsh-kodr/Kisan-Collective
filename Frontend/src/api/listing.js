// src/api/listing.js
import api from "./api";

const listingApi = {
  // Farmer Endpoints
  getMyListings: () => api.get("/listings/me/listings"),
  createListing: (data) => api.post("/listings", data),
  updateListing: (id, data) => api.put(`/listings/${id}`, data),
  deleteListing: (id) => api.delete(`/listings/${id}`),

  // Common (Farmer + FPO + Buyer)
  getListings: () => api.get("/listings"),
  getListingById: (id) => api.get(`/listings/${id}`),

  // alias for clarity
  getOpenListings: () => api.get("/listings"),

  // FPO Endpoints
  getPendingListings: () => api.get("/listings/pending"),
  approveListing: (id) => api.put(`/listings/${id}/approve`),
  rejectListing: (id) => api.put(`/listings/${id}/reject`),
};

export default listingApi;
