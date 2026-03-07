import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authService } from "../services/authService";
import { notificationService } from "../services/notificationService";
import { userService } from "../services/userService";

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'EMPLOYEE' | 'INTERN' | 'MANAGER' | 'HR_ADMIN' | 'HR' | 'ADMIN' | 'employee' | 'intern' | 'manager' | 'hr_admin';
  department: string;
  designation?: string;
  leaveBalances: any[];
  isActive: boolean;
  probationStatus: boolean;
}

interface LeaveBalance {
  leaveType: {
    _id: string;
    name: string;
    code: string;
    color: string;
    accrualRate: number;
    accrualType: string;
    accrualPerMonth?: number;
    yearlyTotal?: number;
    carryForwardLimit?: number;
    maxConsecutiveDays?: number;
  };
  balance: number;
  used: number;
  pending: number;
  available: number;
  earned_leave?: number;
  sick_leave?: number;
  casual_leave?: number;
  earnedLeave?: number;
  sickLeave?: number;
  casualLeave?: number;
}

interface Notification {
  _id: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'DANGER';
  isRead: boolean;
  createdAt: string;
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  register: (data: any) => Promise<{ success: boolean; message: string }>;
  notifications: Notification[];
  unreadCount: number;
  markNotificationRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refreshUser: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  leaveBalances: LeaveBalance[];
  creditInfo: {
    lastCreditedMonth: string | null;
    nextCreditDate: string | null;
    creditDay: number;
  } | null;
  balanceSummary: {
    earned_leave: number;
    sick_leave: number;
    casual_leave: number;
  };
  fetchLeaveBalances: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [creditInfo, setCreditInfo] = useState<{ lastCreditedMonth: string | null; nextCreditDate: string | null; creditDay: number } | null>(null);
  const [balanceSummary, setBalanceSummary] = useState({ earned_leave: 0, sick_leave: 0, casual_leave: 0 });

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = sessionStorage.getItem("user");

      try {
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        } else {
          const me = await authService.getCurrentUser();
          setCurrentUser(me);
        }
        await Promise.all([fetchNotifications(), fetchLeaveBalances()]);
      } catch (error) {
        sessionStorage.removeItem("user");
      }
      setIsLoading(false);
    };

    initAuth();

    // Listen for balance refresh events
    const handleRefreshBalances = () => {
      console.log("AuthContext - Received refreshBalances event");
      fetchLeaveBalances();
    };
    
    const handleLeaveDataUpdate = () => {
      console.log("AuthContext - Received leaveDataUpdated event, refreshing balances");
      fetchLeaveBalances();
    };
    
    window.addEventListener('refreshBalances', handleRefreshBalances);
    window.addEventListener('leaveDataUpdated', handleLeaveDataUpdate);

    return () => {
      window.removeEventListener('refreshBalances', handleRefreshBalances);
      window.removeEventListener('leaveDataUpdated', handleLeaveDataUpdate);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getMyNotifications({ limit: 50 });
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const fetchLeaveBalances = async () => {
    const storedUser = sessionStorage.getItem("user");
    if (!storedUser) return;
    
    try {
      const user = JSON.parse(storedUser);
      const userId = user?._id || user?.id;
      if (!userId) return;
      const response = await userService.getUserBalances(userId);
      setLeaveBalances(response.data.balances || []);
      setCreditInfo(response.data.creditInfo || null);
      setBalanceSummary({
        earned_leave: Number(response.data.earned_leave || 0),
        sick_leave: Number(response.data.sick_leave || 0),
        casual_leave: Number(response.data.casual_leave || 0),
      });
    } catch (error) {
      console.error("Failed to fetch leave balances:", error);
    }
  };

  const refreshUser = async () => {
    try {
      const user = await authService.getCurrentUser();
      setCurrentUser(user);
      await fetchLeaveBalances();
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await authService.login({ email: String(email || "").trim().toLowerCase(), password });
      setCurrentUser(response.data.user);
      sessionStorage.setItem("user", JSON.stringify(response.data.user));
      await Promise.all([fetchNotifications(), fetchLeaveBalances()]);
      return { success: true, message: "Login successful!" };
    } catch (error: any) {
      const message = error.response?.data?.message || "Login failed. Please try again.";
      return { success: false, message };
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setCurrentUser(null);
      sessionStorage.removeItem("user");
      setNotifications([]);
      setLeaveBalances([]);
      setCreditInfo(null);
      setBalanceSummary({ earned_leave: 0, sick_leave: 0, casual_leave: 0 });
    }
  };

  const register = async (data: any): Promise<{ success: boolean; message: string }> => {
    try {
      await authService.register(data);
      return { success: true, message: "Registration successful! HR will activate your account." };
    } catch (error: any) {
      const message = error.response?.data?.message || "Registration failed. Please try again.";
      return { success: false, message };
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        logout,
        register,
        notifications,
        unreadCount,
        markNotificationRead,
        markAllRead,
        refreshUser,
        fetchNotifications,
        leaveBalances,
        creditInfo,
        balanceSummary,
        fetchLeaveBalances,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
