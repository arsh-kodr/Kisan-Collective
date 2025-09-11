// src/components/PayNowButton.jsx
import { useState } from "react";
import api from "../api/api";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const PayNowButton = ({ lotId, amount, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handlePayment = async () => {
    if (!window.Razorpay) {
      toast.error("Razorpay SDK not loaded. Please refresh the page.");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Initiate order on backend
      const { data } = await api.post(
        "/payments/initiate",
        { lotId, amount },
        { withCredentials: true }
      );

      const { order } = data;

      // Step 2: Setup Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "KissanCollective",
        description: "Payment for winning lot",
        order_id: order.id,
        handler: async function (response) {
          try {
            // Step 3: Verify payment with backend
            const verifyRes = await api.post(
              "/payments/verify",
              {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              },
              { withCredentials: true }
            );

            toast.success("✅ Payment successful, order confirmed!");
            onPaymentSuccess?.(verifyRes.data.transaction);
          } catch (err) {
            console.error("Payment verification failed:", err);
            toast.error("Payment verification failed, please contact support.");
          }
        },
        prefill: {
          name: user?.fullName?.firstName
            ? `${user.fullName.firstName} ${user.fullName.lastName || ""}`
            : user?.username || "Buyer",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: { color: "#22c55e" }, // green theme
      };

      // Step 4: Open Razorpay payment window
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Failed to initiate payment:", err);
      toast.error("Failed to initiate payment, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="bg-green-600 text-white px-4 py-2 rounded-xl shadow hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
    >
      {loading ? "Processing..." : `Pay ₹${amount}`}
    </button>
  );
};

export default PayNowButton;
