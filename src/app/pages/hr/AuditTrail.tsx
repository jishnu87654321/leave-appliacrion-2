import React, { useState, useEffect } from "react";
import { Search, Download, Filter, ShieldCheck, User, BookOpen, LogIn, FileBarChart } from "lucide-react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { auditService } from "../../services/auditService";
import { toast } from "sonner";

interface AuditEntry {
  _id: string;
  action: string;
  category: "LEAVE" | "USER" | "POLICY" | "AUTH" | "REPORT" | "SYSTEM";
  performedBy: any;
  performedByName: string;
  performedByRole: string;
  target: string;
  targetId?: string;
  metadata?: any;
  timestamp: string;
  severity?: string;
}

const categoryConfig: Record<AuditEntry["category"], { icon: React.ElementType; bg: string; text: string; label: string }> = {
  LEAVE: { icon: BookOpen, bg: "bg-blue-100", text: "text-blue-700", label: "Leave" },
  USER: { icon: User, bg: "bg-purple-100", text: "text-purple-700", label: "User" },
  POLICY: { icon: ShieldCheck, bg: "bg-green-100", text: "text-green-700", label: "Policy" },
  AUTH: { icon: LogIn, bg: "bg-gray-100", text: "text-gray-700", label: "Auth" },
  REPORT: { icon: FileBarChart, bg: "bg-amber-100", text: "text-amber-700", label: "Report" },
  SYSTEM: { icon: ShieldCheck, bg: "bg-gray-100", text: "text-gray-600", label: "System" },
};

const roleColors: Record<string, string> = {
  EMPLOYEE: "bg-green-100 text-green-700",
  MANAGER: "bg-blue-100 text-blue-700",
  HR_ADMIN: "bg-purple-100 text-purple-700",
  System: "bg-gray-100 text-gray-600",
};

export default function AuditTrail() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const fetchAuditTrail = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit };
      if (categoryFilter !== "ALL") params.category = categoryFilter;
      
      const response = await auditService.getAuditTrail(params);
      setAuditEntries(response.data.entries || []);
      setTotal(response.total || 0);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch audit trail");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditTrail();
  }, [page, categoryFilter]);

  const filtered = auditEntries.filter(a => {
    const matchSearch = (a.action?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (a.performedByName?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (a.target?.toLowerCase() || "").includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || a.performedByRole === roleFilter;
    return matchSearch && matchRole;
  });

  const downloadAudit = () => {
    const rows = [
      ["Action", "Performed By", "Role", "Target", "Timestamp", "Category"],
      ...filtered.map(a => [
        a.action,
        a.performedByName,
        a.performedByRole,
        a.target,
        new Date(a.timestamp).toLocaleString(),
        a.category
      ])
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "audit_trail.csv";
    anchor.click();
    toast.success("Audit trail exported successfully");
  };

  const categories = Object.keys(categoryConfig);

  const formatRelative = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  return (
    <DashboardLayout title="Audit Trail" subtitle="Complete log of all system activities" allowedRoles={["HR_ADMIN", "MANAGER"]}>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {categories.map((cat) => {
          const count = auditEntries.filter(a => a.category === cat).length;
          const config = categoryConfig[cat as AuditEntry["category"]];
          const Icon = config.icon;
          return (
            <div key={cat} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className={`${config.bg} p-2 rounded-xl`}>
                  <Icon className={`w-5 h-5 ${config.text}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-600">{config.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search actions, users, or targets..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{categoryConfig[cat as AuditEntry["category"]].label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="ALL">All Roles</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="HR_ADMIN">HR Admin</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={downloadAudit} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button onClick={fetchAuditTrail} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
            <Filter className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Activity Log</h3>
          <p className="text-sm text-gray-600 mt-1">{filtered.length} of {total} entries</p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading audit trail...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileBarChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Entries Found</h3>
            <p className="text-gray-600">No audit entries match your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filtered.map((entry) => {
              const config = categoryConfig[entry.category];
              const Icon = config.icon;
              const isExpanded = expandedId === entry._id;

              return (
                <div key={entry._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`${config.bg} p-3 rounded-xl flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${config.text}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h4 className="text-sm font-bold text-gray-900 mb-1">{entry.action}</h4>
                          <p className="text-sm text-gray-600">
                            Target: <span className="font-medium text-gray-900">{entry.target}</span>
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-gray-500">{formatRelative(entry.timestamp)}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(entry.timestamp).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{entry.performedByName}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${roleColors[entry.performedByRole] || "bg-gray-100 text-gray-700"}`}>
                          {entry.performedByRole}
                        </span>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${config.bg} ${config.text}`}>
                          {config.label}
                        </span>
                      </div>

                      {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                        <button onClick={() => setExpandedId(isExpanded ? null : entry._id)} className="text-sm text-blue-600 hover:text-blue-700 mt-3 font-medium">
                          {isExpanded ? "Hide" : "Show"} Details
                        </button>
                      )}

                      {isExpanded && entry.metadata && (
                        <div className="mt-3 p-4 bg-gray-50 rounded-xl">
                          <p className="text-xs font-medium text-gray-700 mb-2">Metadata:</p>
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                            {JSON.stringify(entry.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} entries
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Previous
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page * limit >= total} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
