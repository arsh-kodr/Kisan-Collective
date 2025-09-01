import React, {useState} from "react";
import api from "../api";

export default function CheckoutButton({ lotId, amount }) {
  const [loading, setLoading] = useState(false);

  const openCheckout = async () => {
    try {
      setLoading(true);
      // 1) Ask backend to create Razorpay order (amount in rupees)
      const res = await api.post("/payments/initiate", { lotId, amount });
      const { order, transaction } = res.data.order ? res.data : res.data; // some variations
      // Many server responses return order in res.data.order
      const orderData = res.data.order || res.data.razorpayOrder || order;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.id,
        name: "KissanCollective",
        description: `Payment for lot ${lotId}`,
        handler: async function (response) {
          // response: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
          try {
            // 2) Verify payment with backend
            await api.post("/payments/verify", {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });
            alert("Payment verified successfully. Order created/processing.");
            window.location.reload();
          } catch (err) {
            console.error("verify error", err);
            alert("Payment verification failed on server.");
          }
        },
        prefill: { name: "", email: "" },
        theme: { color: "#3399cc" },
      };

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("checkout init error", err);
      alert("Could not initiate payment");
    } finally { setLoading(false); }
  };

  return (
    <button
      onClick={openCheckout}
      disabled={loading}
      className="px-4 py-2 bg-green-600 text-white rounded"
    >
      {loading ? "Loading..." : `Pay ₹${amount}`}
    </button>
  );
}
