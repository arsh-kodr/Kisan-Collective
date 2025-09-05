import api from "./api";

// All lot-related API calls
const lotApi = {
  // ✅ Fetch FPO's own lots
  getMyLots: () => api.get("/lots/my-lots", { withCredentials: true }),

  // ✅ Create a new lot
  createLot: async (data) => {
    const res = await api.post("/lots", data, { withCredentials: true });
    return res.data.lot;
  },

  // ✅ Close a lot
  closeLot: (lotId) =>
    api.post(`/lots/${lotId}/close`, {}, { withCredentials: true }),

  // ✅ Get single lot details
  getLotById: (lotId) =>
    api.get(`/lots/${lotId}`, { withCredentials: true }),
};

export default lotApi;
