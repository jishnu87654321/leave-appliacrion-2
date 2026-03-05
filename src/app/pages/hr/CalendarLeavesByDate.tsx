import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { calendarService } from "../../services/calendarService";
import { useAuth } from "../../context/AuthContext";

type LeaveItem = {
  userId: string;
  name: string;
  leaveType: string;
  leaveTypeName: string;
  status: "PENDING" | "HR_PENDING" | "APPROVED" | "REJECTED";
  department: string;
  startDate: string;
  endDate: string;
};

const rolePrefix = (role: string) => {
  const key = String(role || "").toUpperCase();
  if (key === "HR_ADMIN") return "/hr/calendar";
  if (key === "MANAGER") return "/manager/calendar";
  return "/employee/team-calendar";
};

export default function CalendarLeavesByDate() {
  const { date } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [items, setItems] = useState<LeaveItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  useEffect(() => {
    if (!date) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await calendarService.getLeavesByDate(date, { limit: 5000, page: 1 });
        if (!mounted) return;
        setItems(res?.data?.items || []);
        setTotal(Number(res?.data?.total || 0));
      } catch (err) {
        console.error("Failed to load date leaves:", err);
        if (!mounted) return;
        setItems([]);
        setTotal(0);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [date]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const term = search.trim().toLowerCase();
      const matchSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.department.toLowerCase().includes(term) ||
        item.leaveType.toLowerCase().includes(term) ||
        item.leaveTypeName.toLowerCase().includes(term);
      const matchStatus = statusFilter === "ALL" || item.status === statusFilter;
      const matchType = typeFilter === "ALL" || item.leaveType === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [items, search, statusFilter, typeFilter]);

  const uniqueTypes = useMemo(() => [...new Set(items.map((i) => i.leaveType).filter(Boolean))], [items]);

  if (!currentUser) return null;

  return (
    <DashboardLayout
      title="Leave Applicants by Date"
      subtitle={date ? `Date: ${date}` : "Date view"}
      allowedRoles={["EMPLOYEE", "INTERN", "MANAGER", "HR_ADMIN"]}
    >
      <div className="mb-4">
        <button
          onClick={() => navigate(rolePrefix(String(currentUser.role || "")))}
          className="text-sm text-blue-700 font-semibold hover:underline"
        >
          ← Back to Calendar
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-col md:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name / department / leave type"
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="HR_PENDING">HR Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
          <option value="ALL">All Types</option>
          {uniqueTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">
            {loading ? "Loading..." : `${filteredItems.length} shown / ${total} total applicants`}
          </p>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-gray-500">Loading applicants...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">No applicants found for this date.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3">Employee</th>
                  <th className="text-left px-4 py-3">Department</th>
                  <th className="text-left px-4 py-3">Leave Type</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Range</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, idx) => (
                  <tr key={`${item.userId}-${idx}`} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-gray-700">{item.department || "-"}</td>
                    <td className="px-4 py-3 text-gray-700">{item.leaveTypeName} ({item.leaveType})</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700">{item.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.startDate} to {item.endDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
