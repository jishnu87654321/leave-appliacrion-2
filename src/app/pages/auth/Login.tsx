import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { AuthLayout } from "../../layouts/AuthLayout";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const quickFill = (role: string) => {
    const map: Record<string, string> = {
      employee: "alice@company.com",
      manager: "johnmanager@gmail.com",
      admin: "hradmin@gmail.com",
    };
    setForm({ email: map[role], password: "password123" });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    setError("");
    const result = await login(form.email, form.password);
    setLoading(false);
    if (result.success) {
      // Get role from local storage user
      const stored = localStorage.getItem("lms_user");
      const user = stored ? JSON.parse(stored) : null;
      const roleMap: Record<string, string> = {
        EMPLOYEE: "/employee/dashboard",
        MANAGER: "/manager/dashboard",
        HR_ADMIN: "/hr/dashboard",
      };
      navigate(user ? (roleMap[user.role] || "/employee/dashboard") : "/employee/dashboard", { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-sm w-full mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your LeaveMS account</p>
        </div>

        {/* Quick Login Buttons */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 font-medium mb-2">Quick Demo Login:</p>
          <div className="flex gap-2">
            {[
              { key: "employee", label: "Employee", color: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" },
              { key: "manager", label: "Manager", color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100" },
              { key: "admin", label: "HR Admin", color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100" },
            ].map(({ key, label, color }) => (
              <button key={key} type="button" onClick={() => quickFill(key)}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-lg border transition-colors ${color}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@company.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm pr-11 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                required
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1E3A8A] hover:bg-blue-800 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><LogIn className="w-4 h-4" /> Sign In</>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 font-semibold hover:underline">Register here</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
