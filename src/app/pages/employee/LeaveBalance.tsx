import React from "react";
import { Info, TrendingUp } from "lucide-react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { useLeave } from "../../context/LeaveContext";

export default function LeaveBalance() {
  const { currentUser, leaveBalances, creditInfo, balanceSummary } = useAuth();
  const { leaveRequests, leaveTypes } = useLeave();
  if (!currentUser) return null;

  const currentUserId = (currentUser as any)._id || (currentUser as any).id;
  const myRequests = leaveRequests.filter((r) => r.employeeId === currentUserId);

  // Use dynamic balances from API
  const leaveTypeMeta = new Map((leaveTypes || []).map((lt: any) => [lt.code, lt]));

  const balanceData = leaveBalances
    .filter((lb) => lb.leaveType.code !== "CL")
    .map((lb) => {
    const remaining = lb.balance;
    const used = lb.used;
    const pending = lb.pending;
    const total = remaining + used;
    const pct = total > 0 ? Math.round((remaining / total) * 100) : 100;
    const meta = leaveTypeMeta.get(lb.leaveType.code);
    const yearlyTotal =
      lb.leaveType.yearlyTotal ||
      (lb.leaveType.code === "EL" ? 15 : lb.leaveType.accrualType === "MONTHLY" ? lb.leaveType.accrualRate * 12 : lb.leaveType.accrualRate);
    return {
      id: lb.leaveType._id,
      code: lb.leaveType.code,
      name: lb.leaveType.name,
      color: lb.leaveType.color,
      accrualRate: lb.leaveType.accrualRate,
      accrualType: lb.leaveType.accrualType,
      used,
      remaining,
      pending,
      total,
      pct,
      yearlyTotal,
      carryForwardLimit: lb.leaveType.carryForwardLimit ?? meta?.carryForwardLimit ?? 0,
      maxConsecutiveDays: lb.leaveType.maxConsecutiveDays ?? meta?.maxConsecutiveDays ?? 30,
      allowNegativeBalance: false,
      applicableDuringProbation: true,
    };
  });

  return (
    <DashboardLayout title="Leave Balance" subtitle="Your current leave entitlements and usage" allowedRoles={["EMPLOYEE", "INTERN", "MANAGER", "HR_ADMIN"]}>
      {/* Summary Banner */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Entitled", value: balanceData.reduce((s, b) => s + b.total, 0), color: "border-blue-500", icon: "📋" },
          { label: "Days Used", value: balanceData.reduce((s, b) => s + b.used, 0), color: "border-amber-500", icon: "📅" },
          { label: "Days Remaining", value: balanceData.reduce((s, b) => s + b.remaining, 0), color: "border-green-500", icon: "✅" },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${s.color} p-5`}>
            <p className="text-sm text-gray-500">{s.icon} {s.label}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">days this year</p>
          </div>
        ))}
      </div>

      {/* Explicit Policy Buckets */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-100">
              <th className="py-2 pr-4">Balance Field</th>
              <th className="py-2 pr-4">Display Name</th>
              <th className="py-2">Value (days)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-50">
              <td className="py-2 pr-4 font-mono text-xs text-gray-600">earned_leave</td>
              <td className="py-2 pr-4 font-semibold text-gray-900">Earned Leave</td>
              <td className="py-2 font-bold text-blue-700">{balanceSummary.earned_leave}</td>
            </tr>
            <tr className="border-b border-gray-50">
              <td className="py-2 pr-4 font-mono text-xs text-gray-600">sick_leave</td>
              <td className="py-2 pr-4 font-semibold text-gray-900">Sick Leave</td>
              <td className="py-2 font-bold text-emerald-700">{balanceSummary.sick_leave}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Detailed Leave Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {balanceData.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-1.5 w-full" style={{ backgroundColor: b.color }} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="inline-block text-white text-xs font-bold px-2.5 py-1 rounded-full mb-1" style={{ backgroundColor: b.color }}>{b.code}</span>
                  <h3 className="font-bold text-gray-900 text-sm">{b.name}</h3>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black" style={{ color: b.remaining <= 2 ? "#EF4444" : "#1E293B" }}>{b.remaining}</p>
                  <p className="text-xs text-gray-400">remaining</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Used: {b.used} days</span>
                  <span>Total: {b.total} days</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${100 - b.pct}%`, backgroundColor: b.color, opacity: 0.7 }} />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span style={{ color: b.color }} className="font-medium">{100 - b.pct}% used</span>
                  <span className="text-gray-400">{b.pct}% remaining</span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-1.5 text-xs text-gray-500 border-t border-gray-50 pt-3">
                <div className="flex justify-between">
                  <span>Accrual</span>
                  <span className="font-medium text-gray-700">
                    {b.code === "EL" ? `${b.yearlyTotal} days/year` : `${b.accrualRate} days/${b.accrualType === 'YEARLY' ? 'year' : 'month'}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Carry Forward</span>
                  <span className="font-medium text-gray-700">{b.carryForwardLimit} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Consecutive</span>
                  <span className="font-medium text-gray-700">{b.maxConsecutiveDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Used</span>
                  <span className="font-medium text-gray-700">{b.used} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Pending</span>
                  <span className="font-medium text-gray-700">{b.pending} days</span>
                </div>
                {currentUser.probationStatus && !b.applicableDuringProbation && (
                  <div className="mt-2 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-xs font-medium">
                    ⚠️ Not available during probation
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Policy Info */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-blue-900 text-sm mb-2">Leave Policy Highlights</h4>
            <ul className="space-y-1 text-xs text-blue-700">
              <li>• Earned Leave accrues monthly (1.25 days/month), total annual credit 15 days, carry forward cap 30 days.</li>
              <li>• Sick Leave accrues monthly (1 day/month), total annual credit 12 days.</li>
              {creditInfo?.lastCreditedMonth && <li>• Last credited month: {creditInfo.lastCreditedMonth}</li>}
              {creditInfo?.nextCreditDate && <li>• Next credit date: {new Date(creditInfo.nextCreditDate).toISOString().slice(0, 10)}</li>}
              {currentUser.probationStatus && <li className="text-amber-700 font-medium">• You are currently in the probation period. Earned Leave is not applicable.</li>}
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


