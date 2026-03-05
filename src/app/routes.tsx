import { createBrowserRouter, Navigate } from "react-router";
import { lazy } from "react";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import EmployeeDashboard from "./pages/employee/Dashboard";
import ApplyLeave from "./pages/employee/ApplyLeave";
import LeaveBalance from "./pages/employee/LeaveBalance";
import LeaveHistory from "./pages/employee/LeaveHistory";
import TeamCalendar from "./pages/employee/TeamCalendar";
import ManagerDashboard from "./pages/manager/Dashboard";
import TeamRequests from "./pages/manager/TeamRequests";
import TeamMembers from "./pages/manager/TeamMembers";
import HRDashboard from "./pages/hr/Dashboard";
import Reports from "./pages/hr/Reports";
import LeavePolicy from "./pages/hr/LeavePolicy";
import UserManagement from "./pages/hr/UserManagement";
import AllRequests from "./pages/hr/AllRequests";
import CalendarLeavesByDate from "./pages/hr/CalendarLeavesByDate";

const AuditTrail = lazy(() => import("./pages/hr/AuditTrail"));

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", Component: Login },
  { path: "/register", Component: Register },

  // Employee Routes
  { path: "/employee/dashboard", Component: EmployeeDashboard },
  { path: "/intern/dashboard", Component: EmployeeDashboard },
  { path: "/employee/apply-leave", Component: ApplyLeave },
  { path: "/intern/apply-leave", Component: ApplyLeave },
  { path: "/employee/leave-balance", Component: LeaveBalance },
  { path: "/employee/leave-history", Component: LeaveHistory },
  { path: "/employee/team-calendar", Component: TeamCalendar },
  { path: "/employee/calendar/leaves/:date", Component: CalendarLeavesByDate },
  { path: "/intern/calendar/leaves/:date", Component: CalendarLeavesByDate },

  // Manager Routes (Full HR Access)
  { path: "/manager/dashboard", Component: ManagerDashboard },
  { path: "/manager/leave-types", Component: LeavePolicy }, // Dedicated leave types route
  { path: "/manager/policies", Component: LeavePolicy }, // Alias for leave policies
  { path: "/manager/users", Component: UserManagement }, // User management
  { path: "/manager/requests", Component: AllRequests }, // All requests
  { path: "/manager/reports", Component: Reports },
  { path: "/manager/audit", Component: AuditTrail }, // Audit trail
  { path: "/manager/calendar", Component: TeamCalendar }, // Calendar
  { path: "/manager/calendar/leaves/:date", Component: CalendarLeavesByDate },
  { path: "/manager/apply-leave", Component: ApplyLeave }, // Apply leave as manager
  { path: "/manager/team-requests", Component: TeamRequests }, // Legacy route
  { path: "/manager/team-members", Component: TeamMembers }, // Legacy route
  { path: "/manager/team-calendar", Component: TeamCalendar }, // Legacy route

  // HR Admin Routes
  { path: "/hr/dashboard", Component: HRDashboard },
  { path: "/hr/apply-leave", Component: ApplyLeave }, // Apply leave as HR admin
  { path: "/hr/policies", Component: LeavePolicy },
  { path: "/hr/users", Component: UserManagement },
  { path: "/hr/requests", Component: AllRequests },
  { path: "/hr/reports", Component: Reports },
  { path: "/hr/audit", Component: AuditTrail },
  { path: "/hr/calendar", Component: TeamCalendar },
  { path: "/hr/calendar/leaves/:date", Component: CalendarLeavesByDate },

  { path: "*", element: <Navigate to="/login" replace /> },
]);
