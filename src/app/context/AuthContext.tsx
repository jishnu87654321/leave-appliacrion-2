import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authService } from "../services/authService";
import { notificationService } from "../services/notificationService";
import { userService } from "../services/userService";

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'HR_ADMIN';
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
  };
  balance: number;
  used: number;
  pending: number;
  available: number;
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
  fetchLeaveBalances: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      
      if (token && storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);
          await Promise.all([fetchNotifications(), fetchLeaveBalances()]);
        } catch (error) {
          console.error("Auth init error:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
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
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    
    try {
      const user = JSON.parse(storedUser);
      const response = await userService.getUserBalances(user._id);
      setLeaveBalances(response.data.balances || []);
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
      const response = await authService.login({ email, password });
      setCurrentUser(response.data.user);
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
      setNotifications([]);
      setLeaveBalances([]);
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
