import { useState } from "react";
import api from "../api/api";
import toast from "react-hot-toast";

const PayNowButton = ({ lotId, amount, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const { data } = await api.post(
        "/payments/initiate",
        { lotId, amount },
        { withCredentials: true }
      );

      const { order } = data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "KissanCollective",
        description: "Payment for winning lot",
        order_id: order.id,
        handler: async function (response) {
          try {
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
            console.error(err);
            toast.error("Payment verification failed");
          }
        },
        prefill: { email: "", name: "", contact: "" },
        theme: { color: "#22c55e" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error("Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="bg-green-600 text-white px-4 py-2 rounded-xl shadow hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? "Processing..." : `Pay ₹${amount}`}
    </button>
  );
};

export default PayNowButton;
