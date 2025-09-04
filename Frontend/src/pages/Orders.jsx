import React, { useEffect, useState } from "react";
import api from "../api/api";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    const load = async () => {
      const res = await api.get("/orders/my-orders");
      setOrders(res.data.orders || []);
    };
    load();
  }, []);
  return (
    <div>
      <h2 className="text-xl font-bold">My Orders</h2>
      {orders.map((o) => (
        <div key={o._id} className="bg-white p-3 my-2 rounded">
          <div>Lot: {o.lot?.name}</div>
          <div>Amount: ₹{o.amount}</div>
          <div>Status: {o.status}</div>
        </div>
      ))}
    </div>
  );
}
