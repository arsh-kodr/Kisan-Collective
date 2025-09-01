import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login(){
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email, form.password);


      nav("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <form onSubmit={submit} className="space-y-2">
        <input required placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className="w-full p-2 border rounded" />
        <input required placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} className="w-full p-2 border rounded" />
        <button className="w-full bg-blue-600 text-white py-2 rounded">Login</button>
      </form>
    </div>
  );
}
