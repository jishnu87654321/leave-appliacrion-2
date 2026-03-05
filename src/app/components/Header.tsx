import React, { useState } from "react";
import { Bell, Search, ChevronDown, Check, Info, AlertTriangle, XCircle, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { formatRelative } from "../utils/dateUtils";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const NotifIcon = ({ type }: { type: "INFO" | "SUCCESS" | "WARNING" | "DANGER" }) => {
  const map = {
    INFO: <Info className="w-3.5 h-3.5 text-blue-500" />,
    SUCCESS: <Check className="w-3.5 h-3.5 text-green-500" />,
    WARNING: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
    DANGER: <XCircle className="w-3.5 h-3.5 text-red-500" />,
  };
  return map[type];
};

export const Header = ({ title, subtitle }: HeaderProps) => {
  const { currentUser, notifications, unreadCount, markNotificationRead, markAllRead, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-sm transition-all duration-300">
      <div>
        <h1 className="font-bold text-gray-900 text-lg leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="bg-gray-50 text-sm pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 w-44 transition-all duration-200 focus:w-56"
          />
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 hover:scale-105 transition-all duration-200"
          >
            <Bell className="w-4.5 h-4.5 text-gray-600 w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 min-w-[18px] min-h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-bold text-gray-900 text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400 text-sm">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n._id}
                      onClick={() => markNotificationRead(n._id)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-all duration-200 flex gap-3 items-start border-b border-gray-50 ${!n.isRead ? "bg-blue-50/50" : ""}`}
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <NotifIcon type={n.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 leading-snug">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatRelative(n.createdAt)}</p>
                      </div>
                      {!n.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                    </button>
                  ))
                )}
              </div>
              <div className="px-4 py-2 border-t border-gray-100 text-center">
                <button className="text-xs text-blue-600 hover:underline font-medium">View all</button>
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative pl-3 border-l border-gray-200">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 hover:opacity-80 transition-all duration-200 hover:scale-[1.02]"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              {currentUser?.avatar}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-gray-900 leading-tight">{currentUser?.name}</p>
              <p className="text-xs text-gray-400 leading-tight">{currentUser?.department}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden md:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="font-semibold text-gray-900 text-sm">{currentUser?.name}</p>
                <p className="text-xs text-gray-500">{currentUser?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 hover:bg-red-50 transition-all duration-200 flex items-center gap-2 text-red-600 hover:scale-[1.02]"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
