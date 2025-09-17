import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, 
  X, 
  BarChart3, 
  ListChecks, 
  Package, 
  LogOut, 
  UserCircle,
  Plus,
  Eye,
  Check,
  AlertCircle,
  Clock,
  TrendingUp,
  Users,
  DollarSign
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import listingApi from "../api/listing";
import lotApi from "../api/lotApi";
import statsApi from "../api/statsApi";
import toast from "react-hot-toast";

// Toast notification system
const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  };

  return { toasts, success: (msg) => addToast(msg, 'success'), error: (msg) => addToast(msg, 'error') };
};

// Toast Component
const Toast = ({ toasts }) => (
  <div className="fixed top-4 right-4 z-50 space-y-2">
    {toasts.map(toast => (
      <div
        key={toast.id}
        className={`px-4 py-2 rounded-lg shadow-lg text-white transform transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}
      >
        {toast.message}
      </div>
    ))}
  </div>
);

// Create Lot Modal Component
const CreateLotModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    basePrice: '',
    endTime: '',
    listings: []
  });
  const [availableListings, setAvailableListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Load approved listings for lot creation
      fetchApprovedListings();
    }
  }, [isOpen]);

  const fetchApprovedListings = async () => {
    try {
      const approved = await listingApi.getListings();
      setAvailableListings(Array.isArray(approved) ? approved : []);
    } catch (err) {
      console.error("Failed to load listings:", err);
      toast.error("Failed to load listings");
    }
  };

  // Auto-calculate base price
  useEffect(() => {
    if (formData.listings.length === 0) {
      setFormData(prev => ({ ...prev, basePrice: '' }));
      return;
    }

    const UNIT_CONVERSION = { kg: 1, quintal: 100, tonne: 1000 };
    let totalValue = 0;
    let totalQty = 0;

    formData.listings.forEach(listingId => {
      const listing = availableListings.find(l => l._id === listingId);
      if (listing) {
        const qtyInKg = listing.quantityKg * (UNIT_CONVERSION[listing.unit] || 1);
        const pricePerKg = listing.expectedPricePerKg || listing.mandiPriceAtEntry || 0;
        totalValue += pricePerKg * qtyInKg;
        totalQty += qtyInKg;
      }
    });

    const avgPrice = totalQty > 0 ? Math.round(totalValue / totalQty) : 0;
    setFormData(prev => ({ ...prev, basePrice: avgPrice.toString() }));
  }, [formData.listings, availableListings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newLot = await lotApi.createLot({
        name: formData.name,
        basePrice: Number(formData.basePrice),
        endTime: formData.endTime,
        listings: formData.listings,
      });

      success('Lot created successfully!');
      onSuccess();
      onClose();
      setFormData({ name: '', basePrice: '', endTime: '', listings: [] });
    } catch (err) {
      console.error("Failed to create lot:", err);
      error("Failed to create lot");
    } finally {
      setLoading(false);
    }
  };

  const toggleListing = (listingId) => {
    setFormData(prev => ({
      ...prev,
      listings: prev.listings.includes(listingId)
        ? prev.listings.filter(id => id !== listingId)
        : [...prev.listings, listingId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Create New Lot</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Lot Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              placeholder="E.g. Wheat Harvest Lot 2025"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Base Price (₹ per kg)
            </label>
            <input
              type="number"
              value={formData.basePrice}
              onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              placeholder="Auto-calculated from selected listings"
            />
            <p className="text-xs text-gray-500 mt-2">
              Auto-calculated weighted average, but you can adjust manually
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Auto Close Time
            </label>
            <input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Listings ({formData.listings.length} selected)
            </label>
            <div className="border border-gray-300 rounded-xl max-h-60 overflow-y-auto">
              {availableListings.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No available listings found
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {availableListings.map(listing => (
                    <label
                      key={listing._id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={formData.listings.includes(listing._id)}
                        onChange={() => toggleListing(listing._id)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{listing.crop}</div>
                        <div className="text-sm text-gray-500">
                          {listing.quantityKg} {listing.unit} • {listing.location}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formData.listings.length === 0}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Lot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Lot Details Modal
const LotDetailsModal = ({ lot, isOpen, onClose, onSuccess }) => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    if (isOpen && lot) {
      // Load bids for the specific lot
      fetchBids(lot._id);
    }
  }, [isOpen, lot]);

  const fetchBids = async (lotId) => {
    try {
      // Assuming you have an API method to get bids for a lot
      const lotBids = await lotApi.getBids(lotId);
      setBids(Array.isArray(lotBids) ? lotBids : []);
    } catch (err) {
      console.error("Failed to fetch bids:", err);
      error("Failed to fetch bids");
    }
  };

  const handleCloseLot = async () => {
    setLoading(true);
    try {
      await lotApi.closeLot(lot._id);
      success('Auction closed successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to close auction:", err);
      error("Failed to close auction");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !lot) return null;

  const sortedBids = [...bids].sort((a, b) => b.amount - a.amount);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{lot.name}</h2>
            <p className="text-gray-600 mt-1">
              {lot.listings?.length || 0} listings • {lot.totalQuantity || 0} kg
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="flex items-center justify-between">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              lot.status === 'open' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {lot.status?.charAt(0).toUpperCase() + lot.status?.slice(1) || 'Unknown'}
            </span>
            <div className="text-right">
              <div className="text-sm text-gray-600">Base Price</div>
              <div className="text-xl font-bold text-green-600">₹{lot.basePrice}/kg</div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Bids ({sortedBids.length})
            </h3>
            {sortedBids.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BarChart3 size={48} className="mx-auto mb-3 opacity-50" />
                <p>No bids yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedBids.map((bid, index) => (
                  <div
                    key={bid._id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      index === 0 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-800">
                          {bid.buyer?.fullName || 'Anonymous Buyer'}
                          {index === 0 && (
                            <span className="ml-2 px-2 py-1 text-xs bg-green-600 text-white rounded-full">
                              Highest Bid
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {new Date(bid.createdAt).toLocaleDateString()} at{' '}
                          {new Date(bid.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-800">
                          ₹{bid.amount}/kg
                        </div>
                        <div className="text-sm text-gray-600">
                          Total: ₹{(bid.amount * (lot.totalQuantity || 0)).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {lot.status === 'open' && (
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={handleCloseLot}
              disabled={loading}
              className="w-full px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {loading ? 'Closing Auction...' : 'Close Auction'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Dashboard Component
const FPODashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Data states
  const [stats, setStats] = useState({ listings: 0, lots: 0, bids: 0 });
  const [pendingListings, setPendingListings] = useState([]);
  const [approvedListings, setApprovedListings] = useState([]);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState({ overview: true, listings: true, lots: true });
  const [listingsView, setListingsView] = useState('pending'); // Track which listings view is active

  // Modal states
  const [createLotModal, setCreateLotModal] = useState(false);
  const [lotDetailsModal, setLotDetailsModal] = useState({ isOpen: false, lot: null });

  const { toasts, success, error } = useToast();

  // Fetch data functions
  const fetchStats = async () => {
    try {
      const res = await statsApi.getFpoStats();
      setStats(res.data || { listings: 0, lots: 0, bids: 0 });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      error("Failed to fetch statistics");
    } finally {
      setLoading(prev => ({ ...prev, overview: false }));
    }
  };

  const fetchListings = async () => {
    try {
      const [pendingData, approvedData] = await Promise.all([
        listingApi.getPendingListings(),
        listingApi.getListings(),
      ]);
      setPendingListings(Array.isArray(pendingData) ? pendingData : []);
      setApprovedListings(Array.isArray(approvedData) ? approvedData : []);
    } catch (err) {
      console.error("Error fetching listings:", err);
      error("Failed to fetch listings");
    } finally {
      setLoading(prev => ({ ...prev, listings: false }));
    }
  };

  const fetchLots = async () => {
    try {
      const res = await lotApi.getMyLots();
      setLots(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch lots:", err);
      error("Failed to fetch lots");
    } finally {
      setLoading(prev => ({ ...prev, lots: false }));
    }
  };

  // Listing actions
  const handleApproveListing = async (id) => {
    try {
      await listingApi.approveListing(id);
      setPendingListings(prev => prev.filter(l => l._id !== id));
      
      // Add to approved listings
      const approvedListing = pendingListings.find(l => l._id === id);
      if (approvedListing) {
        setApprovedListings(prev => [...prev, { ...approvedListing, status: 'approved' }]);
      }
      success('Listing approved successfully');
    } catch (err) {
      console.error("Failed to approve listing:", err);
      error("Failed to approve listing");
    }
  };

  const handleRejectListing = async (id) => {
    try {
      await listingApi.rejectListing(id);
      setPendingListings(prev => prev.filter(l => l._id !== id));
      success('Listing rejected successfully');
    } catch (err) {
      console.error("Failed to reject listing:", err);
      error("Failed to reject listing");
    }
  };

  const logout = () => {
    // In a real app, this would clear tokens and redirect
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Load data on component mount and tab changes
  useEffect(() => {
    if (activeTab === 'overview') fetchStats();
    if (activeTab === 'listings') fetchListings();
    if (activeTab === 'lots') fetchLots();
  }, [activeTab]);

  // Overview Cards
  const overviewCards = [
    { 
      title: 'Total Listings', 
      value: stats.listings, 
      icon: ListChecks, 
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      change: '+12%'
    },
    { 
      title: 'Active Lots', 
      value: stats.lots, 
      icon: Package, 
      color: 'bg-gradient-to-br from-green-500 to-green-600',
      change: '+8%'
    },
    { 
      title: 'Total Bids', 
      value: stats.bids, 
      icon: TrendingUp, 
      color: 'bg-gradient-to-br from-purple-500 to-purple-600',
      change: '+24%'
    },
    { 
      title: 'Revenue', 
      value: '₹2.4L', 
      icon: DollarSign, 
      color: 'bg-gradient-to-br from-orange-500 to-orange-600',
      change: '+15%'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Toast toasts={toasts} />
      
      {/* Main Content */}
      <main className="min-h-screen">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Welcome back, FPO Manager!
              </h2>
              <p className="text-sm text-gray-600">
                {activeTab === 'overview' && 'Here\'s your farm collective overview'}
                {activeTab === 'listings' && 'Manage farmer listings'}
                {activeTab === 'lots' && 'Your auction lots'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-full">
              <UserCircle size={24} className="text-green-600" />
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white shadow-sm px-6 py-2 flex border-b">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'listings', label: 'Listings', icon: ListChecks },
            { key: 'lots', label: 'Lots', icon: Package }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {overviewCards.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={index}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-xl ${card.color}`}>
                            <Icon size={24} className="text-white" />
                          </div>
                          <span className="text-sm font-medium text-green-600">
                            {card.change}
                          </span>
                        </div>
                        <div>
                          <p className="text-3xl font-bold text-gray-900 mb-1">
                            {loading.overview ? (
                              <div className="h-8 bg-gray-200 rounded animate-pulse" />
                            ) : (
                              card.value
                            )}
                          </p>
                          <p className="text-sm text-gray-600">{card.title}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setCreateLotModal(true)}
                    className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors text-left"
                  >
                    <div className="p-2 bg-green-600 rounded-lg">
                      <Plus size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-700">Create New Lot</p>
                      <p className="text-sm text-green-600">Bundle listings for auction</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab('listings')}
                    className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-left"
                  >
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <ListChecks size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-blue-700">Review Listings</p>
                      <p className="text-sm text-blue-600">Approve pending listings</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Listings Tab */}
          {activeTab === 'listings' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <button
                    onClick={() => setListingsView('pending')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      listingsView === 'pending'
                        ? 'border-green-600 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Pending ({pendingListings.length})
                  </button>
                  <button
                    onClick={() => setListingsView('approved')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      listingsView === 'approved'
                        ? 'border-green-600 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Approved ({approvedListings.length})
                  </button>
                </div>
              </div>

              <div className="p-6">
                {loading.listings ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl animate-pulse">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-8 bg-gray-200 rounded w-16"></div>
                          <div className="h-8 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Pending Listings View */}
                    {listingsView === 'pending' && (
                      pendingListings.length === 0 ? (
                        <div className="text-center py-12">
                          <ListChecks size={48} className="mx-auto mb-4 text-gray-300" />
                          <p className="text-gray-500">No pending listings</p>
                          <p className="text-sm text-gray-400 mt-1">All listings have been reviewed</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {pendingListings.map(listing => (
                            <div key={listing._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-semibold text-gray-800">{listing.crop}</h4>
                                  <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
                                    Pending
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span>{listing.quantityKg} kg</span>
                                  <span>•</span>
                                  <span>{listing.location}</span>
                                  <span>•</span>
                                  <span>₹{listing.expectedPricePerKg}/kg</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleApproveListing(listing._id)}
                                  className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                                >
                                  <Check size={16} />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectListing(listing._id)}
                                  className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                                >
                                  <X size={16} />
                                  Reject
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}

                    {/* Approved Listings View */}
                    {listingsView === 'approved' && (
                      approvedListings.length === 0 ? (
                        <div className="text-center py-12">
                          <Check size={48} className="mx-auto mb-4 text-gray-300" />
                          <p className="text-gray-500">No approved listings yet</p>
                          <p className="text-sm text-gray-400 mt-1">Approved listings will appear here</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {approvedListings.map(listing => (
                            <div key={listing._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-semibold text-gray-800">{listing.crop}</h4>
                                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                                    Approved
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span>{listing.quantityKg} kg</span>
                                  <span>•</span>
                                  <span>{listing.location}</span>
                                  <span>•</span>
                                  <span>₹{listing.expectedPricePerKg}/kg</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-green-600 text-sm font-medium">Ready for auction</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Lots Tab */}
          {activeTab === 'lots' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">My Auction Lots</h2>
                  <p className="text-gray-600 mt-1">Create and manage your auction lots</p>
                </div>
                <button
                  onClick={() => setCreateLotModal(true)}
                  className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-medium shadow-sm"
                >
                  <Plus size={20} />
                  Create Lot
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading.lots ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl animate-pulse">
                        <div className="space-y-2">
                          <div className="h-5 bg-gray-200 rounded w-48"></div>
                          <div className="h-3 bg-gray-200 rounded w-32"></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-6 bg-gray-200 rounded w-16"></div>
                          <div className="h-8 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : lots.length === 0 ? (
                  <div className="p-12 text-center">
                    <Package size={64} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No lots created yet</h3>
                    <p className="text-gray-500 mb-6">Create your first auction lot to start selling</p>
                    <button
                      onClick={() => setCreateLotModal(true)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors font-medium"
                    >
                      <Plus size={20} />
                      Create First Lot
                    </button>
                  </div>
                ) : (
                  <div className="p-6 space-y-4">
                    {lots.map(lot => (
                      <div key={lot._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-sm transition-all">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-gray-800">{lot.name}</h4>
                            <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                              lot.status === 'open' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {lot.status?.charAt(0).toUpperCase() + lot.status?.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{lot.listings?.length || 0} listings</span>
                            <span>•</span>
                            <span>{lot.totalQuantity || 0} kg</span>
                            <span>•</span>
                            <span className="font-medium text-green-600">₹{lot.basePrice}/kg</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {lot.status === 'open' && (
                            <div className="flex items-center gap-1 text-green-600 text-sm">
                              <Clock size={16} />
                              <span>Active</span>
                            </div>
                          )}
                          <button
                            onClick={() => setLotDetailsModal({ isOpen: true, lot })}
                            className="flex items-center gap-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                          >
                            <Eye size={16} />
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <CreateLotModal
        isOpen={createLotModal}
        onClose={() => setCreateLotModal(false)}
        onSuccess={() => {
          fetchLots();
          fetchStats();
        }}
      />

      <LotDetailsModal
        isOpen={lotDetailsModal.isOpen}
        lot={lotDetailsModal.lot}
        onClose={() => setLotDetailsModal({ isOpen: false, lot: null })}
        onSuccess={() => {
          fetchLots();
          fetchStats();
        }}
      />
    </div>
  );
};

export default FPODashboard;