// src/api/lotApi.js
import api from "./api";

const lotApi = {
  getLots: () => api.get("/lots"),
  createLot: (data) => api.post("/lots", data),
};

export default lotApi;
