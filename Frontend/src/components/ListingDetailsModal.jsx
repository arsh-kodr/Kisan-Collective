import api from "../api/api";
import config from "../config/config";

const { apiRoutes } = config;

export default function ListingDetailsModal({ listing, onClose, onAction }) {
  if (!listing) return null;

  const handleApprove = async () => {
    try {
      await api.put(apiRoutes.listings.approve(listing._id));
      onAction && onAction();
      onClose && onClose();
    } catch (err) {
      console.error("approve listing", err);
    }
  };

  const handleReject = async () => {
    try {
      await api.put(apiRoutes.listings.reject(listing._id));
      onAction && onAction();
      onClose && onClose();
    } catch (err) {
      console.error("reject listing", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg">
        <h2 className="text-lg font-bold mb-4">{listing.crop}</h2>

        <img src={listing.photos?.[0] || "https://via.placeholder.com/600x300"} alt={listing.crop} className="w-full h-40 object-cover rounded-lg mb-3" />

        <p><strong>Farmer:</strong> {listing.createdBy?.fullName?.firstName ?? ""} {listing.createdBy?.fullName?.lastName ?? ""}</p>
        <p><strong>Username (FPO/farmer):</strong> {listing.createdBy?.username}</p>
        <p><strong>Location:</strong> {listing.location}</p>
        <p><strong>Quantity:</strong> {listing.quantityKg ?? listing.quantity ?? listing.totalQuantity ?? 0} {listing.unit ?? "kg"}</p>
        <p><strong>Expected Price/kg:</strong> ₹{listing.expectedPricePerKg ?? listing.mandiPriceAtEntry ?? 0}</p>
        <p className="text-sm text-gray-500 mt-2">{listing.description}</p>

        <div className="flex space-x-2 mt-4">
          {listing.status === "pending" && (
            <>
              <button onClick={handleApprove} className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg">Approve</button>
              <button onClick={handleReject} className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg">Reject</button>
            </>
          )}
          <button onClick={onClose} className="flex-1 bg-gray-200 px-4 py-2 rounded-lg">Close</button>
        </div>
      </div>
    </div>
  );
}
