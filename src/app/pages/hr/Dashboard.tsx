import React, { useEffect } from "react";
import { Users, FileText, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { Link } from "react-router";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { StatCard } from "../../components/StatCard";
import { LeaveStatusBadge } from "../../components/LeaveStatusBadge";
import { useLeave } from "../../context/LeaveContext";
import { useAuth } from "../../context/AuthContext";
import { formatDate } from "../../utils/dateUtils";

export default function HRDashboard() {
  const { leaveRequests, allUsers, isLoading, refreshAllData } = useLeave();
  const { currentUser } = useAuth();
  const roleKey = String(currentUser?.role || "").toUpperCase();

  // Ensure data is loaded when component mounts
  useEffect(() => {
    if ((leaveRequests.length === 0 || allUsers.length === 0) && !isLoading) {
      console.log("HRDashboard - No data found, triggering refresh");
      refreshAllData();
    }
  }, []); // Only run once on mount

  // Auto-refresh every 30 seconds to catch new leave requests
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("HRDashboard - Auto-refreshing data");
      refreshAllData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [refreshAllData]);

  // Listen for leave data updates
  useEffect(() => {
    const handleLeaveUpdate = () => {
      console.log("HRDashboard - Received leaveDataUpdated event, refreshing...");
      refreshAllData();
    };
    
    window.addEventListener('leaveDataUpdated', handleLeaveUpdate);
    
    return () => {
      window.removeEventListener('leaveDataUpdated', handleLeaveUpdate);
    };
  }, [refreshAllData]);

  // Show loading state while data is being fetched
  if (isLoading) {
    const pageTitle = roleKey === "MANAGER" ? "Manager Dashboard" : "HR Dashboard";
    const pageSubtitle = roleKey === "MANAGER" ? "Full system access and leave management" : "System-wide leave management overview";
    
    return (
      <DashboardLayout title={pageTitle} subtitle={pageSubtitle} allowedRoles={["HR_ADMIN", "MANAGER"]}>
        <div className="animate-in fade-in duration-300">
          {/* Loading skeleton for stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-32 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
          
          {/* Loading skeleton for content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 h-64 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-16 bg-gray-100 rounded-xl"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const pageTitle = roleKey === "MANAGER" ? "Manager Dashboard" : "HR Dashboard";
  const pageSubtitle = roleKey === "MANAGER" ? "Full system access and leave management" : "System-wide leave management overview";
  
  const pending = leaveRequests.filter(r => r.status === "PENDING" || r.status === "HR_PENDING");
  const approved = leaveRequests.filter(r => r.status === "APPROVED").length;
  const rejected = leaveRequests.filter(r => r.status === "REJECTED").length;
  const activeUsers = allUsers.filter(u => u.isActive).length;
  const onProbation = allUsers.filter(u => u.probationStatus).length;

  return (
    <DashboardLayout title={pageTitle} subtitle={pageSubtitle} allowedRoles={["HR_ADMIN", "MANAGER"]}>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard title="Total Employees" value={activeUsers} subtitle={`${onProbation} on probation`} icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" accent="border-blue-500" />
        <StatCard title="Pending Actions" value={pending.length} subtitle="Requires review" icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-600" accent="border-amber-500" />
        <StatCard title="Approved Leaves" value={approved} subtitle="This year" icon={CheckCircle} iconBg="bg-green-50" iconColor="text-green-600" accent="border-green-500" />
        <StatCard title="Rejected" value={rejected} subtitle="This year" icon={XCircle} iconBg="bg-red-50" iconColor="text-red-500" accent="border-red-500" />
        <StatCard title="Total Requests" value={leaveRequests.length} subtitle="All time" icon={FileText} iconBg="bg-purple-50" iconColor="text-purple-600" accent="border-purple-500" />
      </div>

      {/* Pending Alert */}
      {pending.length > 0 && (
        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-bold text-amber-900 text-sm">{pending.length} leave request{pending.length > 1 ? "s" : ""} awaiting action system-wide</p>
              <p className="text-xs text-amber-700">Some may require HR intervention or manager escalation</p>
            </div>
          </div>
          <Link to="/hr/requests" className="bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-amber-700 transition-colors flex-shrink-0">
            Review All
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Recent Leave Requests</h2>
            <Link to="/hr/requests" className="text-xs text-blue-600 hover:underline font-medium">View all →</Link>
          </div>
          <div className="space-y-2.5">
            {[...leaveRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: r.leaveTypeColor }}>{r.leaveTypeCode}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{r.employeeName}</p>
                  <p className="text-xs text-gray-400">{r.leaveTypeName} · {r.totalDays}d · {formatDate(r.createdAt)}</p>
                </div>
                <LeaveStatusBadge status={r.status} size="sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Department Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-3 text-sm">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Leave Policies", to: "/hr/policies", color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
              { label: "User Management", to: "/hr/users", color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
              { label: "System Calendar", to: "/hr/calendar", color: "bg-green-50 text-green-700 hover:bg-green-100" },
              { label: "Audit Trail", to: "/hr/audit", color: "bg-gray-50 text-gray-700 hover:bg-gray-100" },
            ].map((a) => (
              <Link key={a.label} to={a.to} className={`${a.color} text-sm font-semibold px-3 py-2 rounded-xl text-center transition-colors`}>{a.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
