import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DashboardLayout } from "../../layouts/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { useLeave } from "../../context/LeaveContext";
import { getDaysInMonth, getFirstDayOfMonth, getMonthName, isDateInRange, toInputDate } from "../../utils/dateUtils";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TeamCalendar() {
  const { currentUser } = useAuth();
  const { leaveRequests, allUsers, fetchLeaveRequests, isLoading } = useLeave();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeaveRequests();
    }, 30000); // 30 seconds

    // Listen for leave data updates from other components
    const handleLeaveUpdate = () => {
      console.log("TeamCalendar - Received leaveDataUpdated event, refreshing...");
      fetchLeaveRequests();
    };
    
    window.addEventListener('leaveDataUpdated', handleLeaveUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('leaveDataUpdated', handleLeaveUpdate);
    };
  }, [fetchLeaveRequests]);

  // Re-render calendar when leave data changes
  useEffect(() => {
    console.log("TeamCalendar - Leave data updated, calendar will re-render");
    console.log("TeamCalendar - Approved Leaves:", leaveRequests.filter(r => r.status === "APPROVED").length);
  }, [leaveRequests]);

  if (!currentUser) return null;

  // Get team members based on role
  // Employee sees ONLY their own leaves
  // Manager sees their team
  // HR Admin sees ALL users
  const isHRAdmin = currentUser.role === "HR_ADMIN";
  const isManager = currentUser.role === "MANAGER";
  const isEmployee = currentUser.role === "EMPLOYEE";
  
  const currentUserId = currentUser._id || currentUser.id;
  
  let teamMembers;
  if (isEmployee) {
    // Employee sees ONLY themselves
    teamMembers = [];
  } else if (isHRAdmin) {
    // HR Admin sees ALL users
    teamMembers = allUsers.filter((u) => (u._id || u.id) !== currentUserId);
  } else if (isManager) {
    // Manager sees their department
    teamMembers = allUsers.filter((u) => u.department === currentUser.department && (u._id || u.id) !== currentUserId && u.role !== "HR_ADMIN");
  } else {
    teamMembers = [];
  }
  
  // Apply department filter for HR Admin
  if (isHRAdmin && departmentFilter !== "ALL") {
    teamMembers = teamMembers.filter(u => u.department === departmentFilter);
  }
  
  const allTeamMembers = [currentUser, ...teamMembers];
  const memberColors = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6", "#F97316", "#EC4899", "#06B6D4", "#84CC16", "#A855F7"];
  
  // Get all departments for filter
  const departments = [...new Set(allUsers.map(u => u.department).filter(Boolean))].sort();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const getApprovedLeavesForDate = (dateStr: string) =>
    leaveRequests.filter(
      (r) => r.status === "APPROVED" && isDateInRange(dateStr, r.fromDate, r.toDate) &&
        allTeamMembers.some((m) => {
          const memberId = m._id || m.id;
          return memberId === r.employeeId || memberId === r.employee?._id || memberId === r.employee?.id;
        })
    );

  console.log("TeamCalendar - Current User ID:", currentUserId);
  console.log("TeamCalendar - Team Members:", allTeamMembers.length);
  console.log("TeamCalendar - Total Leave Requests:", leaveRequests.length);
  console.log("TeamCalendar - Approved Leaves:", leaveRequests.filter(r => r.status === "APPROVED").length);

  const nav = (dir: 1 | -1) => {
    let m = month + dir, y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setMonth(m); setYear(y);
    setSelectedDay(null);
  };

  const selectedLeaves = selectedDay ? getApprovedLeavesForDate(selectedDay) : [];

  return (
    <DashboardLayout 
      title={isHRAdmin ? "System Calendar" : isEmployee ? "My Leave Calendar" : "Team Calendar"} 
      subtitle={isHRAdmin ? "All approved leaves across the organization" : isEmployee ? "Your approved leave schedule" : `${currentUser.department} department leave calendar`} 
      allowedRoles={["EMPLOYEE", "MANAGER", "HR_ADMIN"]}
    >
      {/* Department Filter for HR Admin */}
      {isHRAdmin && (
        <div className="mb-5 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">Filter by Department:</label>
            <select 
              value={departmentFilter} 
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="ALL">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            {departmentFilter !== "ALL" && (
              <span className="text-xs text-gray-500">
                Showing {allTeamMembers.length} member{allTeamMembers.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="xl:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm font-medium text-gray-600">Updating calendar...</p>
              </div>
            </div>
          )}
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <button onClick={() => nav(-1)} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <h2 className="font-bold text-gray-900 text-lg">{getMonthName(month)} {year}</h2>
            <button onClick={() => nav(1)} className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {days.map((d) => (
              <div key={d} className={`py-3 text-center text-xs font-bold ${d === "Sun" || d === "Sat" ? "text-gray-400" : "text-gray-700"}`}>{d}</div>
            ))}
          </div>

          {/* Date grid */}
          <div className="grid grid-cols-7">
            {[...Array(firstDay)].map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] border-r border-b border-gray-50" />
            ))}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const dateStr = toInputDate(new Date(year, month, day));
              const leavesOnDay = getApprovedLeavesForDate(dateStr);
              const dayOfWeek = (firstDay + i) % 7;
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
              const isToday = dateStr === toInputDate(new Date());
              const isSelected = dateStr === selectedDay;

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                  className={`min-h-[80px] p-1.5 border-r border-b border-gray-50 cursor-pointer transition-colors ${isWeekend ? "bg-gray-50/50" : "bg-white hover:bg-blue-50/30"} ${isSelected ? "bg-blue-50 ring-2 ring-blue-400 ring-inset" : ""}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-1 ${isToday ? "bg-[#1E3A8A] text-white" : isWeekend ? "text-gray-400" : "text-gray-700"}`}>{day}</div>
                  <div className="space-y-0.5">
                    {leavesOnDay.slice(0, 3).map((leave, idx) => {
                      const memberIdx = allTeamMembers.findIndex((m) => {
                        const memberId = m._id || m.id;
                        return memberId === leave.employeeId || memberId === leave.employee?._id || memberId === leave.employee?.id;
                      });
                      const color = memberColors[memberIdx % memberColors.length];
                      const member = allTeamMembers.find((m) => {
                        const memberId = m._id || m.id;
                        return memberId === leave.employeeId || memberId === leave.employee?._id || memberId === leave.employee?.id;
                      });
                      return (
                        <div key={idx} className="text-[9px] px-1 py-0.5 rounded text-white font-medium truncate" style={{ backgroundColor: color }} title={`${member?.name} - ${leave.leaveTypeName}${isHRAdmin ? ` (${member?.department})` : ''}`}>
                          {member?.name.split(" ")[0]} ({leave.leaveTypeCode})
                        </div>
                      );
                    })}
                    {leavesOnDay.length > 3 && (
                      <p className="text-[9px] text-gray-500 text-center">+{leavesOnDay.length - 3} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Team Legend */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">
              {isHRAdmin ? `All Employees (${allTeamMembers.length})` : isEmployee ? "Your Leaves" : "Team Members"}
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {isHRAdmin ? (
                // Group by department for HR Admin
                (() => {
                  const departments = [...new Set(allTeamMembers.map(m => m.department))].sort();
                  return departments.map(dept => {
                    const deptMembers = allTeamMembers.filter(m => m.department === dept);
                    return (
                      <div key={dept} className="mb-3">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-1.5">{dept}</p>
                        <div className="space-y-1.5">
                          {deptMembers.map((m, idx) => {
                            const globalIdx = allTeamMembers.findIndex(tm => tm.id === m.id);
                            return (
                              <div key={m.id} className="flex items-center gap-2.5">
                                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: memberColors[globalIdx % memberColors.length] }} />
                                <span className="text-xs text-gray-700 font-medium truncate">{m.name}{m.id === currentUser.id ? " (You)" : ""}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()
              ) : (
                // Simple list for employees/managers
                allTeamMembers.map((m, idx) => (
                  <div key={m.id} className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: memberColors[idx % memberColors.length] }} />
                    <span className="text-xs text-gray-700 font-medium">{m.name}{m.id === currentUser.id ? " (You)" : ""}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected Day Info */}
          {selectedDay && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-3 text-sm">
                {new Date(selectedDay + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </h3>
              {selectedLeaves.length === 0 ? (
                <p className="text-xs text-gray-400">No approved leaves on this day</p>
              ) : (
                <div className="space-y-2">
                  {selectedLeaves.map((leave, i) => {
                    const member = allTeamMembers.find((m) => {
                      const memberId = m._id || m.id;
                      return memberId === leave.employeeId || memberId === leave.employee?._id || memberId === leave.employee?.id;
                    });
                    const memberIdx = allTeamMembers.findIndex((m) => {
                      const memberId = m._id || m.id;
                      return memberId === leave.employeeId || memberId === leave.employee?._id || memberId === leave.employee?.id;
                    });
                    const color = memberColors[memberIdx % memberColors.length];
                    return (
                      <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg" style={{ backgroundColor: color + "18" }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: color }}>
                          {member?.avatar || member?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900">{member?.name}</p>
                          <p className="text-xs text-gray-500">
                            {leave.leaveTypeName}{leave.halfDay ? ` (${leave.halfDaySession} Half)` : ""}
                          </p>
                          {isHRAdmin && (
                            <p className="text-[10px] text-gray-400">{member?.department}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Stats for Month */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-900 mb-3 text-sm">This Month Stats</h3>
            {(() => {
              const monthLeaves = leaveRequests.filter((r) => {
                const from = new Date(r.fromDate);
                return r.status === "APPROVED" && from.getMonth() === month && from.getFullYear() === year &&
                  allTeamMembers.some((m) => {
                    const memberId = m._id || m.id;
                    return memberId === r.employeeId || memberId === r.employee?._id || memberId === r.employee?.id;
                  });
              });
              return (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-gray-500">Total Leaves</span><span className="font-bold text-gray-900">{monthLeaves.length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Total Days</span><span className="font-bold text-gray-900">{monthLeaves.reduce((s, r) => s + r.totalDays, 0)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Team Members on Leave</span><span className="font-bold text-gray-900">{new Set(monthLeaves.map((r) => r.employeeId)).size}</span></div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
