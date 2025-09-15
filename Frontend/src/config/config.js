// src/config/config.js

// detect if app runs locally or in production
const isLocalhost =
  typeof window !== "undefined" && window.location.hostname === "localhost";

const API_BASE = isLocalhost
  ? "http://localhost:3000/api"
  : "https://kisan-collective.onrender.com/api";

const SOCKET_URL = isLocalhost
  ? "http://localhost:3000"
  : "https://kisan-collective.onrender.com";

const apiRoutes = {
  system: { health: `${API_BASE}/health` },

  auth: {
    register: `${API_BASE}/auth/register`,
    login: `${API_BASE}/auth/login`,
    refresh: `${API_BASE}/auth/refresh`,
    logout: `${API_BASE}/auth/logout`,
    profile: `${API_BASE}/auth/profile`,
  },

  user: {
    profile: `${API_BASE}/user/profile`,
    updateProfile: `${API_BASE}/user/profile`,
    changePassword: `${API_BASE}/user/profile/password`,
    deleteAccount: `${API_BASE}/user/profile`,
    adminDashboard: `${API_BASE}/user/admin-dashboard`,
  },

  listings: {
    all: `${API_BASE}/listings`,
    open: `${API_BASE}/listings/open`,
    pending: `${API_BASE}/listings/pending`,
    farmerListings: (farmerId) => `${API_BASE}/listings/farmer/${farmerId}`,
    myListings: `${API_BASE}/listings/me/listings`,
    create: `${API_BASE}/listings`,
    update: (id) => `${API_BASE}/listings/${id}`,
    delete: (id) => `${API_BASE}/listings/${id}`,
    approve: (id) => `${API_BASE}/listings/${id}/approve`,
    reject: (id) => `${API_BASE}/listings/${id}/reject`,
    byId: (id) => `${API_BASE}/listings/${id}`,
  },

  lots: {
    all: `${API_BASE}/lots`,
    myLots: `${API_BASE}/lots/my-lots`,
    meLots: `${API_BASE}/lots/me/lots`,
    create: `${API_BASE}/lots`,
    pool: `${API_BASE}/lots/pool`,
    close: (lotId) => `${API_BASE}/lots/${lotId}/close`,
    byId: (id) => `${API_BASE}/lots/${id}`,
  },

  bids: {
    placeBid: `${API_BASE}/bids/place-bid`,
    myBids: `${API_BASE}/bids/my-bids`,
    highest: (lotId) => `${API_BASE}/bids/lots/${lotId}/highest`,
    forLot: (lotId) => `${API_BASE}/bids/lots/${lotId}`,
    closeAuction: (lotId) => `${API_BASE}/bids/lots/${lotId}/close`,
  },

  orders: {
    create: `${API_BASE}/orders/create`,
    myOrders: `${API_BASE}/orders/my-orders`,
    fpoOrders: `${API_BASE}/orders/fpo-orders`,
    updateStatus: (orderId) => `${API_BASE}/orders/${orderId}/status`,
  },

  payments: {
    initiate: `${API_BASE}/payments/initiate`,
    verify: `${API_BASE}/payments/verify`,
    myTransactions: `${API_BASE}/payments/my-transactions`,
    forLot: (lotId) => `${API_BASE}/payments/lot/${lotId}`,
    webhook: `${API_BASE}/payments/webhook`, // backend-only
  },

  fpo: {
    stats: `${API_BASE}/fpo/stats`,
  },
};

const config = { API_BASE, SOCKET_URL, apiRoutes };

export default config;
