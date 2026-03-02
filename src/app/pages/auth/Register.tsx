import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { UserPlus, AlertCircle, CheckCircle } from "lucide-react";
import { AuthLayout } from "../../layouts/AuthLayout";
import { useAuth } from "../../context/AuthContext";

const departments = ["Engineering", "Marketing", "Design", "Human Resources", "Finance", "Operations", "Sales"];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    department: "", designation: "", phone: "", role: "EMPLOYEE" as "EMPLOYEE" | "MANAGER",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  const validate = () => {
    if (!form.name.trim()) return "Full name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email address.";
    if (form.password.length < 6) return "Password must be at least 6 characters.";
    if (form.password !== form.confirmPassword) return "Passwords do not match.";
    if (!form.department) return "Please select a department.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError("");
    const result = await register({ name: form.name, email: form.email, password: form.password, department: form.department, designation: form.designation, phone: form.phone, role: form.role });
    setLoading(false);
    if (result.success) {
      setSuccess(result.message);
      setTimeout(() => navigate("/login"), 2500);
    } else {
      setError(result.message);
    }
  };

  return (
    <AuthLayout>
      <div className="max-w-sm w-full mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Register to access the Leave Management System</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />{success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
              <input type="text" value={form.name} onChange={(e) => handleChange("name", e.target.value)}
                placeholder="John Doe"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" required />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address *</label>
              <input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)}
                placeholder="you@company.com"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password *</label>
              <input type="password" value={form.password} onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Min. 6 chars"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password *</label>
              <input type="password" value={form.confirmPassword} onChange={(e) => handleChange("confirmPassword", e.target.value)}
                placeholder="Re-enter password"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Department *</label>
              <select value={form.department} onChange={(e) => handleChange("department", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white" required>
                <option value="">Select...</option>
                {departments.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Designation</label>
              <input type="text" value={form.designation} onChange={(e) => handleChange("designation", e.target.value)}
                placeholder="e.g. Developer"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
              <input type="tel" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="+1-555-0000"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Register As *</label>
              <select 
                value={form.role} 
                onChange={(e) => handleChange("role", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 bg-white"
                required
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {form.role === "MANAGER" 
                  ? "⚠️ Manager accounts require HR Admin approval before activation"
                  : "Employee accounts require HR Admin approval before activation"
                }
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs text-blue-800">
              <strong>Note:</strong> Your account will be reviewed and activated by HR Admin after verification.
            </p>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-[#1E3A8A] hover:bg-blue-800 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60 mt-1">
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><UserPlus className="w-4 h-4" /> Create Account</>
            }
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
