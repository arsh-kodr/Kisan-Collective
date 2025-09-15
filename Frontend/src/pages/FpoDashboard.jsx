import { useState, useEffect } from "react";
import {
  BarChart3,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Plus,
  Search,
  MapPin,
  IndianRupee,
  Wheat,
  Gavel,
  Timer,
  Award,
  TrendingUp,
} from "lucide-react";
import api from "../api/api";
import config from "../config/config";
import CreateLotModal from "../components/CreateLotModal";
import ListingDetailsModal from "../components/ListingDetailsModal";
import LotDetailsModal from "../components/LotDetailsModal";

const { apiRoutes } = config;

const FpoDashboard = () => {
  // --- UI state
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // --- data
  const [stats, setStats] = useState({});
  const [listings, setListings] = useState([]);
  const [lots, setLots] = useState([]);

  // --- modals / selection
  const [showCreateLotModal, setShowCreateLotModal] = useState(false);
  const [createLotInitialListings, setCreateLotInitialListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedLot, setSelectedLot] = useState(null);
  const [selectedStat, setSelectedStat] = useState(null); // overview modal

  // --- fetchers
  const fetchStats = async () => {
    try {
      const res = await api.get(apiRoutes.fpo.stats);
      setStats(res.data || {});
    } catch (err) {
      console.error("fetchStats", err);
    }
  };

  const fetchListings = async () => {
    try {
      const res = await api.get(apiRoutes.listings.all);
      const payload = res.data;
      setListings(Array.isArray(payload) ? payload : payload.listings || []);
    } catch (err) {
      console.error("fetchListings", err);
    }
  };

  const fetchLots = async () => {
    try {
      const res = await api.get(apiRoutes.lots.all);
      const payload = res.data;
      setLots(Array.isArray(payload) ? payload : payload.lots || []);
    } catch (err) {
      console.error("fetchLots", err);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchListings(), fetchLots()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  // --- filters & helpers
  const filteredListings = listings.filter((listing = {}) => {
    const crop = (listing.crop || "").toString().toLowerCase();
    const farmer = (listing.createdBy?.username || "").toString().toLowerCase();
    const matchesSearch =
      crop.includes(searchTerm.toLowerCase()) ||
      farmer.includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || listing.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // --- CRUD actions
  const handleApprove = async (id) => {
    try {
      await api.put(apiRoutes.listings.approve(id));
      await fetchListings();
      await fetchStats();
    } catch (err) {
      console.error("Approve failed", err);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.put(apiRoutes.listings.reject(id));
      await fetchListings();
      await fetchStats();
    } catch (err) {
      console.error("Reject failed", err);
    }
  };

  const handleOpenCreateFromListing = (listingId) => {
    setCreateLotInitialListings([listingId]);
    setShowCreateLotModal(true);
  };

  const handleCreateLotSuccess = async () => {
    setShowCreateLotModal(false);
    setCreateLotInitialListings([]);
    await fetchLots();
    await fetchStats();
  };

  const handleViewBids = (lot) => {
    setSelectedLot(lot);
  };

  const handleCloseAuction = async (lotId) => {
    try {
      await api.post(apiRoutes.lots.close(lotId));
      await fetchLots();
      await fetchStats();
    } catch (err) {
      console.error("Close auction failed", err);
    }
  };

  // --- presentational components
  const StatCard = ({ title, value, icon: Icon, change, color = "blue" }) => (
    <div
      className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md cursor-pointer transform transition hover:scale-105"
      onClick={() => setSelectedStat({ title, value })}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className={`text-3xl font-bold mt-2`}>
            {typeof value === "number" && title.includes("Revenue")
              ? `₹${value.toLocaleString()}`
              : value ?? 0}
          </p>
          {change && (
            <p className="text-green-500 text-sm mt-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              {change}
            </p>
          )}
        </div>
        <div className={`bg-${color}-50 p-3 rounded-xl`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const ListingCard = ({ listing }) => (
    <div
      className="bg-white max-w-sm w-full rounded-xl shadow border overflow-hidden flex flex-col transform transition duration-200 hover:scale-105 hover:shadow-lg cursor-pointer"
      onClick={() => setSelectedListing(listing)}
    >
      {/* Top Section */}
      <div className="relative">
        <img
          src={listing.photos?.[0] || "https://via.placeholder.com/300"}
          alt={listing.crop}
          className="w-full h-40 object-cover"
        />
        <span
          className={`absolute top-2 right-2 px-3 py-1 rounded-full text-xs font-medium shadow ${
            listing.status === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : listing.status === "approved"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {listing.status}
        </span>
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-semibold mb-1">{listing.crop}</h3>
        <p className="text-gray-600 text-sm">
          by {listing.createdBy.fullName?.firstName}{" "}
          {listing.createdBy.fullName?.lastName}
        </p>
        <div className="flex items-center text-gray-500 text-sm mt-1">
          <MapPin className="w-4 h-4 mr-1" />
          {listing.location}
        </div>
      </div>
    </div>
  );

  const LotCard = ({ lot }) => (
    <div
      className="bg-white max-w-sm w-full rounded-xl shadow border overflow-hidden flex flex-col transform transition duration-200 hover:scale-105 hover:shadow-lg cursor-pointer"
      onClick={() => setSelectedLot(lot)}
    >
      <div className="p-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{lot.name}</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium shadow ${
            lot.status === "open"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {lot.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 px-4 pb-4 text-sm text-gray-600">
        <div className="flex items-center">
          <IndianRupee className="w-4 h-4 mr-1 text-gray-400" />
          {lot.basePrice}
        </div>
        <div className="flex items-center">
          <Wheat className="w-4 h-4 mr-1 text-gray-400" /> {lot.totalQuantity} kg
        </div>
        <div className="flex items-center">
          <Award className="w-4 h-4 mr-1 text-gray-400" /> ₹
          {lot.highestBid?.amount || 0}
        </div>
      </div>
    </div>
  );

  // --- render
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center">
            <Wheat className="w-6 h-6 text-green-600 mr-2" /> FPO Dashboard
          </h1>
          <button
            onClick={() => {
              setCreateLotInitialListings([]);
              setShowCreateLotModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" /> Create Lot
          </button>
        </div>
      </div>

      {/* tabs */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg mb-6">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "listings", label: "Listings", icon: Package },
            { id: "lots", label: "Lots & Auctions", icon: Gavel },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center px-4 py-2 rounded-md text-sm ${
                activeTab === t.id
                  ? "bg-white text-blue-600 shadow"
                  : "text-gray-600"
              }`}
            >
              <t.icon className="w-4 h-4 mr-2" /> {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard
              title="Pending Listings"
              value={stats?.pendingListings || 0}
              icon={Clock}
              color="yellow"
            />
            <StatCard
              title="Approved Listings"
              value={stats?.approvedListings || 0}
              icon={CheckCircle}
              color="green"
            />
            <StatCard
              title="Active Lots"
              value={stats?.lotsCreated || 0}
              icon={Package}
              color="blue"
            />
            <StatCard
              title="Closed Lots"
              value={stats?.closedLots || 0}
              icon={Award}
              color="purple"
            />
            <StatCard
              title="Total Revenue"
              value={stats?.totalRevenue || 0}
              icon={IndianRupee}
              color="green"
            />
          </div>
        )}

        {/* Listings */}
        {activeTab === "listings" && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search crop or farmer"
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredListings.map((l) => (
                <div key={l._id} className="flex justify-center">
                  <ListingCard listing={l} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lots */}
        {activeTab === "lots" && (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {lots.map((lot) => (
              <div key={lot._id} className="flex justify-center">
                <LotCard lot={lot} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateLotModal
        isOpen={showCreateLotModal}
        onClose={() => setShowCreateLotModal(false)}
        onCreated={handleCreateLotSuccess}
        initialListingIds={createLotInitialListings}
      />

      <ListingDetailsModal
        listing={selectedListing}
        onClose={() => setSelectedListing(null)}
        onAction={async () => {
          await fetchListings();
          await fetchStats();
        }}
      />

      <LotDetailsModal
        lot={selectedLot}
        onClose={() => setSelectedLot(null)}
        onAction={async () => {
          await fetchLots();
          await fetchStats();
        }}
      />

      {/* Overview Stat Modal */}
      {selectedStat && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{selectedStat.title}</h2>
            <p className="text-lg">
              Value:{" "}
              <span className="font-semibold">
                {typeof selectedStat.value === "number" &&
                selectedStat.title.includes("Revenue")
                  ? `₹${selectedStat.value.toLocaleString()}`
                  : selectedStat.value}
              </span>
            </p>
            <div className="mt-6 text-right">
              <button
                onClick={() => setSelectedStat(null)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FpoDashboard;
