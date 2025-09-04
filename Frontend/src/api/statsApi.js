// src/api/statsApi.js
import api from "./api";

const statsApi = {
  getFpoStats: () => api.get("/fpo/stats"),
};

export default statsApi;
