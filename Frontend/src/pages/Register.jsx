import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    mobile: "",
    role: "buyer",
  });
  const [error, setError] = useState(null);
  const { register } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();

    // ✅ Validate mobile number
    if (!/^\d{10}$/.test(form.mobile)) {
      setError("Mobile number must be 10 digits.");
      return;
    }

    const payload = {
      username: form.username,
      email: form.email,
      password: form.password,
      mobile: form.mobile,
      role: form.role,
      fullName: {
        firstName: form.firstName,
        lastName: form.lastName,
      },
    };

    try {
      await register(payload);
      alert("Registered — now login");
      nav("/login");
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Register</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={submit} className="space-y-2">
        <input
          required
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <input
          required
          placeholder="First Name"
          value={form.firstName}
          onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <input
          required
          placeholder="Last Name"
          value={form.lastName}
          onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <input
          required
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <input
          required
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <input
          required
          placeholder="Mobile (10 digits)"
          value={form.mobile}
          onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          className="w-full p-2 border rounded"
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="w-full p-2 border rounded"
        >
          <option value="buyer">Buyer</option>
          <option value="farmer">Farmer</option>
          <option value="fpo">FPO</option>
        </select>
        <button className="w-full bg-blue-600 text-white py-2 rounded">
          Register
        </button>
      </form>
    </div>
  );
}
