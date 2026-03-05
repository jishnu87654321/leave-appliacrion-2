import React, { useEffect, useState } from "react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { reportService } from "../../services/reportService";

export default function Reports() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthly, setMonthly] = useState<any[]>([]);
  const [dept, setDept] = useState<any[]>([]);
  const [employeeReport, setEmployeeReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadReports = async () => {
    setLoading(true);
    setError("");
    try {
      const [monthlyRes, deptRes, employeeRes] = await Promise.all([
        reportService.getMonthlyReport(year),
        reportService.getDepartmentReport(),
        reportService.getEmployeeReport(),
      ]);
      setMonthly(monthlyRes?.data?.report || []);
      setDept(deptRes?.data?.report || []);
      setEmployeeReport(employeeRes?.data?.report || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [year]);

  return (
    <DashboardLayout title="Reports" subtitle="Monthly and department-level leave analytics" allowedRoles={["HR_ADMIN", "MANAGER"]}>
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-semibold text-gray-700">Year</label>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm w-28"
        />
        <button onClick={loadReports} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">Refresh</button>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">Loading reports...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-3">Monthly Report ({year})</h3>
            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {monthly.map((m) => (
                <div key={m.month} className="flex justify-between text-sm p-2 rounded-lg bg-gray-50">
                  <span className="font-medium text-gray-700">{m.monthName}</span>
                  <span className="text-gray-600">A:{m.approved} P:{m.pending} R:{m.rejected} Days:{m.totalDays}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-3">Department Report</h3>
            <div className="space-y-2 max-h-[480px] overflow-y-auto">
              {dept.map((d) => (
                <div key={d.department} className="text-sm p-3 rounded-lg bg-gray-50">
                  <p className="font-semibold text-gray-800">{d.department}</p>
                  <p className="text-gray-600">Employees: {d.totalEmployees} | Requests: {d.totalRequests} | Approved Days: {d.totalApprovedDays}</p>
                  <p className="text-gray-500">Approval Rate: {d.approvalRate}% | Avg Days/Emp: {d.avgDaysPerEmployee}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5 overflow-x-auto">
          <h3 className="font-bold text-gray-900 mb-3">Employee Leave Balances (Earned Leave Visible)</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 pr-4">Employee</th>
                <th className="py-2 pr-4">Department</th>
                <th className="py-2 pr-4">Earned Leave</th>
                <th className="py-2 pr-4">Sick Leave</th>
                <th className="py-2">Total Approved Days</th>
              </tr>
            </thead>
            <tbody>
              {employeeReport.map((row) => {
                const earned = Number(row?.earned_leave ?? row?.earnedLeave ?? 0);
                const sick = Number(row?.sick_leave ?? row?.sickLeave ?? 0);
                return (
                  <tr key={row?.employee?.id} className="border-b border-gray-50">
                    <td className="py-2 pr-4 font-medium text-gray-900">{row?.employee?.name}</td>
                    <td className="py-2 pr-4 text-gray-600">{row?.employee?.department}</td>
                    <td className="py-2 pr-4 font-bold text-blue-700">{earned}</td>
                    <td className="py-2 pr-4 font-bold text-emerald-700">{sick}</td>
                    <td className="py-2 font-semibold text-gray-800">{row?.totalApprovedDays || 0}</td>
                  </tr>
                );
              })}
              {employeeReport.length === 0 && (
                <tr>
                  <td className="py-3 text-gray-400" colSpan={5}>No employee report data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
