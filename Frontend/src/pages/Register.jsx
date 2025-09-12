import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

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
      alert("Registered successfully — now login");
      nav("/login");
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl rounded-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-extrabold text-green-700">
              Kissan Collective
            </CardTitle>
            <p className="text-gray-500 text-sm mt-1">Create your account 🌱</p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                {error}
              </div>
            )}
            <form onSubmit={submit} className="space-y-3">
              <Input
                required
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
              <Input
                required
                placeholder="First Name"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
              <Input
                required
                placeholder="Last Name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
              <Input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <Input
                required
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <Input
                required
                placeholder="Mobile (10 digits)"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              />

              {/* Role Select */}
              <Select
                value={form.role}
                onValueChange={(val) => setForm({ ...form, role: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyer">Buyer</SelectItem>
                  <SelectItem value="farmer">Farmer</SelectItem>
                  <SelectItem value="fpo">FPO</SelectItem>
                </SelectContent>
              </Select>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                Register
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-green-700 font-medium hover:underline"
              >
                Login
              </a>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
