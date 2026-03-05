import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Send, AlertCircle, CheckCircle, Info } from "lucide-react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { useLeave } from "../../context/LeaveContext";
import { calculateWorkingDays, getTodayStr, formatDate } from "../../utils/dateUtils";

export default function ApplyLeave() {
  const { currentUser, leaveBalances, fetchLeaveBalances } = useAuth();
  const { leaveTypes, submitLeaveRequest, fetchLeaveTypes, fetchLeaveRequests } = useLeave();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    leaveTypeId: "",
    fromDate: "",
    toDate: "",
    halfDay: false,
    halfDaySession: "MORNING" as "MORNING" | "AFTERNOON",
    reason: "",
  });
  const [totalDays, setTotalDays] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [attachment, setAttachment] = useState<{ fileName: string; mimeType: string; size: number; base64: string } | null>(null);

  const today = getTodayStr();

  useEffect(() => {
    if (form.fromDate && form.toDate) {
      const days = calculateWorkingDays(form.fromDate, form.toDate, form.halfDay);
      setTotalDays(days);
    } else {
      setTotalDays(0);
    }
  }, [form.fromDate, form.toDate, form.halfDay]);

  // Always sync the latest policy + balances when opening Apply Leave.
  useEffect(() => {
    fetchLeaveBalances();
    fetchLeaveTypes();
    fetchLeaveRequests();
  }, [fetchLeaveBalances, fetchLeaveTypes, fetchLeaveRequests]);

  if (!currentUser) return null;

  const selectedType = leaveTypes.find((lt) => lt._id === form.leaveTypeId);
  
  // Get balance from leaveBalances array
  const selectedBalance = leaveBalances.find(lb => lb.leaveType._id === form.leaveTypeId);
  const availableBalance = selectedBalance ? selectedBalance.available : 0;
  
  const hasEnoughBalance = selectedType?.allowNegativeBalance || availableBalance >= totalDays;
  const isProbationRestricted = currentUser.probationStatus && selectedType && !selectedType.applicableDuringProbation;

  const availableTypes = leaveTypes.filter(
    (lt) => lt.code !== "CL" && !(currentUser.probationStatus && !lt.applicableDuringProbation)
  );

  const handleChange = (field: string, value: string | boolean) =>
    setForm((p) => ({ ...p, [field]: value }));

  const validate = () => {
    if (!form.leaveTypeId) return "Please select a leave type.";
    if (!form.fromDate) return "Please select a from date.";
    if (!form.toDate) return "Please select a to date.";
    if (new Date(form.toDate) < new Date(form.fromDate)) return "To date cannot be before from date.";
    if (!form.reason.trim()) return "Reason is required.";
    if (form.reason.trim().length < 10) return "Please provide a more detailed reason (min. 10 chars).";
    if (totalDays === 0) return "Selected date range has no working days.";
    if (!hasEnoughBalance && !selectedType?.allowNegativeBalance) return `Insufficient ${selectedType?.code} balance. Available: ${availableBalance} days.`;
    if (isProbationRestricted) return "This leave type is not available during probation period.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    setError("");

    try {
      const result = await submitLeaveRequest({
        leaveTypeId: form.leaveTypeId,
        fromDate: form.fromDate,
        toDate: form.halfDay ? form.fromDate : form.toDate,
        halfDay: form.halfDay,
        halfDaySession: form.halfDay ? form.halfDaySession : undefined,
        reason: form.reason.trim(),
        attachment: attachment || undefined,
      });

      if (result.success) {
        setSubmitMessage(result.message || "");
        setSubmitted(true);
        setTimeout(() => navigate("/employee/leave-history"), 2000);
      } else {
        setError(result.message || "Failed to submit leave request.");
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Error submitting leave:", error);
      setError(error?.response?.data?.message || error?.message || "Failed to submit leave request.");
      setLoading(false);
    }
  };

  if (submitted) return (
    <DashboardLayout title="Apply for Leave" allowedRoles={["EMPLOYEE", "INTERN", "MANAGER", "HR_ADMIN"]}>
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
        <p className="text-gray-500 text-sm">{submitMessage || "Your leave request has been submitted and is awaiting approval. Redirecting..."}</p>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Apply for Leave" subtitle="Submit a new leave request" allowedRoles={["EMPLOYEE", "INTERN", "MANAGER", "HR_ADMIN"]}>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#1E3A8A] via-[#3B82F6] to-[#0EA5E9]" />
          <div className="p-6">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Leave Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Leave Type *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableTypes.map((lt) => {
                    const balanceInfo = leaveBalances.find(lb => lb.leaveType._id === lt._id);
                    const bal = balanceInfo ? balanceInfo.balance : 0;
                    const sel = form.leaveTypeId === lt._id;
                    return (
                      <button type="button" key={lt._id} onClick={() => handleChange("leaveTypeId", lt._id)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${sel ? "border-blue-500 bg-blue-50" : "border-gray-100 hover:border-gray-200"}`}>
                        <span className="inline-block text-xs font-bold text-white px-2 py-0.5 rounded-full mb-1.5" style={{ backgroundColor: lt.color }}>{lt.code}</span>
                        <p className="text-xs font-semibold text-gray-900 leading-tight">{lt.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Balance: <span className={`font-bold ${bal <= 2 ? "text-red-500" : "text-green-600"}`}>{bal}</span></p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Half Day Toggle */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <input type="checkbox" id="halfDay" checked={form.halfDay} onChange={(e) => handleChange("halfDay", e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                <label htmlFor="halfDay" className="text-sm font-medium text-gray-700 cursor-pointer">Half Day Leave</label>
                {form.halfDay && (
                  <select value={form.halfDaySession} onChange={(e) => handleChange("halfDaySession", e.target.value)}
                    className="ml-auto border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none">
                    <option value="MORNING">Morning</option>
                    <option value="AFTERNOON">Afternoon</option>
                  </select>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">From Date *</label>
                  <input type="date" value={form.fromDate} min={today}
                    onChange={(e) => { handleChange("fromDate", e.target.value); if (!form.toDate || form.toDate < e.target.value) handleChange("toDate", e.target.value); }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{form.halfDay ? "Date" : "To Date *"}</label>
                  <input type="date" value={form.halfDay ? form.fromDate : form.toDate} min={form.fromDate || today}
                    disabled={form.halfDay}
                    onChange={(e) => handleChange("toDate", e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 disabled:bg-gray-50" required />
                </div>
              </div>

              {/* Working Days Info */}
              {totalDays > 0 && (
                <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${hasEnoughBalance ? "bg-blue-50 border border-blue-100 text-blue-800" : "bg-red-50 border border-red-100 text-red-700"}`}>
                  <Info className="w-4 h-4 flex-shrink-0" />
                  <span>
                    <strong>{totalDays} working day{totalDays !== 1 ? "s" : ""}</strong> requested.
                    {selectedType && <> Available balance: <strong>{availableBalance} {selectedType.code}</strong>.</>}
                    {!hasEnoughBalance && " ⚠️ Insufficient balance!"}
                  </span>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason *</label>
                <textarea value={form.reason} onChange={(e) => handleChange("reason", e.target.value)}
                  placeholder="Please provide a detailed reason for your leave request..."
                  rows={4}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 resize-none"
                  required />
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-400">Minimum 10 characters required</span>
                  <span className={`text-xs ${form.reason.length < 10 ? "text-red-400" : "text-gray-400"}`}>{form.reason.length}/500</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Supporting Document (optional)</label>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) {
                      setAttachment(null);
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      const base64 = String(reader.result || "").split(",")[1] || "";
                      setAttachment({
                        fileName: file.name,
                        mimeType: file.type || "application/octet-stream",
                        size: file.size,
                        base64,
                      });
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
                {attachment && (
                  <p className="text-xs text-gray-500 mt-1">Attached: {attachment.fileName}</p>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => navigate(-1)}
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading || isProbationRestricted}
                  className="flex-1 px-4 py-3 bg-[#1E3A8A] hover:bg-blue-800 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><Send className="w-4 h-4" /> Submit Request</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

