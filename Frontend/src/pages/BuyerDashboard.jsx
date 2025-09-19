import React, { useEffect, useState } from "react";
import {
  ShoppingBag,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  Download,
  Eye,
  RefreshCw,
  Filter,
  User,
  MapPin,
  Calendar,
  IndianRupee,
  Building,
  Phone,
  Mail,
  X,
  AlertCircle,
} from "lucide-react";

import config from "../config/config";
const { apiRoutes } = config;
import api from "../api/api";


// Status configurations
const statusConfig = {
  pending: {
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: Clock,
    label: "Payment Pending",
  },
  paid: {
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: CreditCard,
    label: "Payment Completed",
  },
  shipped: {
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: Truck,
    label: "In Transit",
  },
  delivered: {
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: CheckCircle,
    label: "Delivered",
  },
  cancelled: {
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    icon: XCircle,
    label: "Cancelled",
  },
};

// Enhanced Order Card Component
const OrderCard = ({ order, onClick }) => {
  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  return (
    <div
      onClick={() => onClick(order)}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-green-200 transition-all duration-300 cursor-pointer group"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate group-hover:text-green-600 transition-colors">
              {order.lot?.name}
            </h3>
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <Building className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{order.fpo?.username}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
              <span className="truncate">{order.fpo?.location}</span>
            </div>
          </div>
          <div
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${status.bg} ${status.color} ${status.border}`}
          >
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Amount</span>
            <div className="flex items-center font-semibold text-gray-900">
              <IndianRupee className="w-4 h-4 mr-1" />
              {(order.amount / 100 || order.amount).toLocaleString("en-IN")}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Quantity</span>
            <span className="font-medium text-gray-900">
              {order.lot?.quantity}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Order Date</span>
            <span className="text-sm text-gray-900">
              {new Date(order.createdAt).toLocaleDateString("en-IN")}
            </span>
          </div>
        </div>

        {/* Action Indicator */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Order ID: {order._id.slice(-8).toUpperCase()}
          </div>
          <Eye className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition-colors" />
        </div>
      </div>
    </div>
  );
};

// Enhanced Modal Component
const OrderModal = ({
  order,
  isOpen,
  onClose,
  onPaymentRetry,
  onDownloadReceipt,
}) => {
  if (!isOpen || !order) return null;

  const status = statusConfig[order.status];
  const StatusIcon = status.icon;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Status Banner */}
            <div
              className={`flex items-center justify-center p-4 rounded-xl mb-6 ${status.bg} ${status.border} border`}
            >
              <StatusIcon className={`w-6 h-6 mr-3 ${status.color}`} />
              <span className={`text-lg font-semibold ${status.color}`}>
                {status.label}
              </span>
            </div>

            {/* Order Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Product Details
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      {order.lot?.name}
                    </h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Crop: {order.lot?.crop}</p>
                      <p>Quantity: {order.lot?.quantity}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    FPO Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center">
                      <Building className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm font-medium">
                        {order.fpo?.username}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {order.fpo?.location}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {order.fpo?.contact}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Order Summary
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Order ID</span>
                      <span className="text-sm font-mono">
                        {order._id.slice(-12).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Amount</span>
                      <div className="flex items-center font-semibold">
                        <IndianRupee className="w-4 h-4 mr-1" />
                        {(order.amount / 100 || order.amount).toLocaleString(
                          "en-IN"
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Order Date</span>
                      <span className="text-sm">
                        {new Date(order.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                    {order.trackingId && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          Tracking ID
                        </span>
                        <span className="text-sm font-mono text-blue-600">
                          {order.trackingId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Delivery Address
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-900">
                      <p>{order.shippingAddress?.address}</p>
                      <p>
                        {order.shippingAddress?.city},{" "}
                        {order.shippingAddress?.state}
                      </p>
                      <p>PIN: {order.shippingAddress?.pincode}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            {order.status !== "pending" && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  Order Timeline
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Order Placed</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  {order.paidAt && (
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Payment Completed</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.paidAt).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  )}

                  {order.shippedAt && (
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-3">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Order Shipped</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.shippedAt).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  )}

                  {order.deliveredAt && (
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3">
                        <CheckCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Delivered</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.deliveredAt).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  )}

                  {order.cancelledAt && (
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center mr-3">
                        <XCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Order Cancelled</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.cancelledAt).toLocaleString("en-IN")}
                        </p>
                        {order.cancelReason && (
                          <p className="text-xs text-red-600 mt-1">
                            Reason: {order.cancelReason}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
              {order.status === "pending" && (
                <button
                  onClick={() => onPaymentRetry(order)}
                  className="flex items-center px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Complete Payment
                </button>
              )}

              {(order.status === "paid" || order.status === "delivered") && (
                <button
                  onClick={() => onDownloadReceipt(order)}
                  className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Receipt
                </button>
              )}

              <button
                onClick={onClose}
                className="flex items-center px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
export default function BuyerDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState([]);

  // fetchUser

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get(`${apiRoutes.user.profile}`);
        setUser(res.data.user || []);
      } catch (error) {
        console.error(error);
        setError("Failed to load User. Please try again later.");
      }
    };
    fetchUser();
  } , []);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get(`${apiRoutes.orders.myOrders}`);
        console.log("Orders Data -> ", res.data);
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load orders. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
    
  }, []);

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const summary = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    paid: orders.filter((o) => o.status === "paid").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setModalOpen(true);
  };

  const handlePaymentRetry = async (order) => {
    try {
      const res = await api.post("/payment/initiate", {
        lotId: order.lot._id,
        amount: order.amount / 100 || order.amount,
      });

      // Simulate Razorpay payment
      alert("Payment Successful! (Demo Mode)");
      setOrders((prev) =>
        prev.map((o) =>
          o._id === order._id
            ? { ...o, status: "paid", paidAt: new Date().toISOString() }
            : o
        )
      );
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Payment initiation failed. Please try again.");
    }
  };

  const handleDownloadReceipt = (order) => {
    const receiptData = {
      orderId: order._id,
      productName: order.lot?.name,
      fpo: order.fpo?.username,
      amount: order.amount / 100 || order.amount,
      orderDate: order.createdAt,
      status: order.status,
    };

    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(receiptData, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `receipt_${order._id}.json`);
    dlAnchor.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {user.fullName?.firstName || user.username}!
              </h1>
              <p className="text-gray-600 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Manage your orders and track deliveries
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {Object.entries(summary).map(([key, value]) => {
            const config =
              key === "total"
                ? {
                    icon: ShoppingBag,
                    color: "text-gray-700",
                    bg: "bg-gray-50",
                    border: "border-gray-200",
                  }
                : statusConfig[key] || {};
            const Icon = config.icon || ShoppingBag;

            return (
              <div
                key={key}
                className={`bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-shadow ${
                  config.border || "border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon
                    className={`w-8 h-8 ${config.color || "text-gray-600"}`}
                  />
                  <span
                    className={`text-2xl font-bold ${
                      config.color || "text-gray-900"
                    }`}
                  >
                    {value}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-600 capitalize">
                  {key === "total" ? "Total Orders" : `${key} Orders`}
                </p>
              </div>
            );
          })}
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Orders</h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Filter:</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              "all",
              "pending",
              "paid",
              "shipped",
              "delivered",
              "cancelled",
            ].map((status) => {
              const config =
                status === "all"
                  ? { color: "text-gray-700", bg: "bg-gray-100" }
                  : statusConfig[status] || {};

              return (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    filter === status
                      ? "bg-green-600 text-white shadow-lg"
                      : `${config.bg || "bg-gray-100"} ${
                          config.color || "text-gray-700"
                        } hover:shadow-md`
                  }`}
                >
                  <span className="capitalize">
                    {status === "all" ? "All Orders" : status}
                  </span>
                  <span className="ml-2 text-xs opacity-75">
                    ({status === "all" ? summary.total : summary[status]})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === "all" ? "No orders yet" : `No ${filter} orders`}
            </h3>
            <p className="text-gray-600 mb-4">
              {filter === "all"
                ? "Start browsing lots to place your first order."
                : `You don't have any ${filter} orders at the moment.`}
            </p>
            {filter !== "all" && (
              <button
                onClick={() => setFilter("all")}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                View All Orders
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onClick={handleOrderClick}
              />
            ))}
          </div>
        )}

        {/* Order Details Modal */}
        <OrderModal
          order={selectedOrder}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onPaymentRetry={handlePaymentRetry}
          onDownloadReceipt={handleDownloadReceipt}
        />
      </div>
    </div>
  );
}
