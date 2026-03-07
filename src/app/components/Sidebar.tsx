import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard, CalendarDays, FileText, Users, Settings,
  LogOut, ChevronLeft, ChevronRight, Shield, FilePlus, Calendar,
  Wallet, ClipboardList, UserCheck, BookOpen, Activity,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface NavItem {
  label: string;
  to: string;
  icon: React.ElementType;
}

const employeeNav: NavItem[] = [
  { label: "Dashboard", to: "/employee/dashboard", icon: LayoutDashboard },
  { label: "Apply Leave", to: "/employee/apply-leave", icon: FilePlus },
  { label: "Leave Balance", to: "/employee/leave-balance", icon: Wallet },
  { label: "My Requests", to: "/employee/leave-history", icon: ClipboardList },
  { label: "Team Calendar", to: "/employee/team-calendar", icon: Calendar },
];

const internNav: NavItem[] = [
  { label: "Dashboard", to: "/intern/dashboard", icon: LayoutDashboard },
  { label: "Apply Leave", to: "/intern/apply-leave", icon: FilePlus },
  { label: "Leave Balance", to: "/intern/leave-balance", icon: Wallet },
  { label: "My Requests", to: "/intern/leave-history", icon: ClipboardList },
  { label: "Team Calendar", to: "/intern/team-calendar", icon: Calendar },
];

const managerNav: NavItem[] = [
  { label: "Dashboard", to: "/manager/dashboard", icon: LayoutDashboard },
  { label: "Apply Leave", to: "/manager/apply-leave", icon: FilePlus },
  { label: "Leave Types", to: "/manager/leave-types", icon: BookOpen },
  { label: "User Management", to: "/manager/users", icon: Users },
  { label: "All Requests", to: "/manager/requests", icon: ClipboardList },
  { label: "Reports", to: "/manager/reports", icon: FileText },
  { label: "System Calendar", to: "/manager/calendar", icon: CalendarDays },
];

const hrNav: NavItem[] = [
  { label: "Dashboard", to: "/hr/dashboard", icon: LayoutDashboard },
  { label: "Apply Leave", to: "/hr/apply-leave", icon: FilePlus },
  { label: "Leave Types", to: "/hr/policies", icon: BookOpen },
  { label: "User Management", to: "/hr/users", icon: Users },
  { label: "All Requests", to: "/hr/requests", icon: ClipboardList },
  { label: "Reports", to: "/hr/reports", icon: FileText },
  { label: "Audit Trail", to: "/hr/audit", icon: Activity },
  { label: "System Calendar", to: "/hr/calendar", icon: CalendarDays },
];

const navMap = { EMPLOYEE: employeeNav, INTERN: internNav, MANAGER: managerNav, HR_ADMIN: hrNav, HR: hrNav, ADMIN: hrNav };

export const Sidebar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const roleKey = String(currentUser?.role || "").toUpperCase();

  if (!currentUser) return null;
  const navItems = navMap[roleKey] || [];

  const roleConfig = {
    EMPLOYEE: { label: "Employee", color: "bg-green-500" },
    INTERN: { label: "Intern", color: "bg-cyan-500" },
    MANAGER: { label: "Manager", color: "bg-blue-500" },
    HR_ADMIN: { label: "HR Admin", color: "bg-purple-600" },
    HR: { label: "HR", color: "bg-purple-600" },
    ADMIN: { label: "Admin", color: "bg-purple-700" },
  };
  const rc = roleConfig[roleKey] || roleConfig.EMPLOYEE;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={`flex flex-col bg-[#1E293B] text-white transition-all duration-500 ease-in-out ${collapsed ? "w-16" : "w-64"} min-h-screen relative flex-shrink-0`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 transition-all duration-300 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-in fade-in slide-in-from-left-2 duration-300">
            <p className="font-bold text-sm leading-tight">LeaveMS</p>
            <p className="text-xs text-white/50 leading-tight">Management System</p>
          </div>
        )}
      </div>

      {/* User Info */}
      {!collapsed && (
        <div className="px-4 py-4 border-b border-white/10 animate-in fade-in slide-in-from-left-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {currentUser.avatar}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{currentUser.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${rc.color}`} />
                <span className="text-xs text-white/50">{rc.label}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-blue-600 text-white shadow-md scale-[1.02]"
                  : "text-white/60 hover:text-white hover:bg-white/10 hover:scale-[1.02]"
              } ${collapsed ? "justify-center" : ""}`
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-4.5 h-4.5 flex-shrink-0 w-[18px] h-[18px]" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className={`px-2 pb-4 space-y-0.5 border-t border-white/10 pt-2`}>
        <button
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </button>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-all ${collapsed ? "justify-center" : ""}`}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-[#1E293B] border border-white/20 rounded-full flex items-center justify-center hover:bg-blue-600 hover:scale-110 transition-all duration-200 shadow-md"
      >
        {collapsed ? <ChevronRight className="w-3 h-3 text-white" /> : <ChevronLeft className="w-3 h-3 text-white" />}
      </button>
    </aside>
  );
};
