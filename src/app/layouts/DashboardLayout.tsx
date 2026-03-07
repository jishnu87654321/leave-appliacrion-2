import React, { ReactNode } from "react";
import { Navigate } from "react-router";
import { Sidebar } from "../components/Sidebar";
import { Header } from "../components/Header";
import { useAuth } from "../context/AuthContext";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  allowedRoles?: string[];
}

export const DashboardLayout = ({ children, title, subtitle, allowedRoles }: DashboardLayoutProps) => {
  const { currentUser, isLoading } = useAuth();
  const normalizeRole = (role?: string) => String(role || "").trim().toUpperCase();

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-3 animate-in zoom-in-95 fade-in duration-500">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Loading...</p>
      </div>
    </div>
  );

  if (!currentUser) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.map(normalizeRole).includes(normalizeRole(currentUser.role))) {
    const redirectMap: Record<string, string> = {
      EMPLOYEE: "/employee/dashboard",
      INTERN: "/intern/dashboard",
      MANAGER: "/manager/dashboard",
      HR_ADMIN: "/hr/dashboard",
      HR: "/hr/dashboard",
      ADMIN: "/hr/dashboard",
    };
    return <Navigate to={redirectMap[normalizeRole(currentUser.role)] || "/login"} replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
