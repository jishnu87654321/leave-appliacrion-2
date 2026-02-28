import React from "react";
import { Check, X, Clock, Ban } from "lucide-react";
import type { LeaveStatus } from "../data/mockData";

interface Props {
  status: LeaveStatus;
  size?: "sm" | "md" | "lg";
}

const config: Record<LeaveStatus, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  PENDING: { label: "Pending", bg: "bg-amber-100", text: "text-amber-700", icon: Clock },
  APPROVED: { label: "Approved", bg: "bg-green-100", text: "text-green-700", icon: Check },
  REJECTED: { label: "Rejected", bg: "bg-red-100", text: "text-red-700", icon: X },
  CANCELLED: { label: "Cancelled", bg: "bg-gray-100", text: "text-gray-600", icon: Ban },
};

export const LeaveStatusBadge = ({ status, size = "md" }: Props) => {
  const c = config[status];
  const Icon = c.icon;
  const sizes = { sm: "text-xs px-2 py-0.5 gap-1", md: "text-xs px-2.5 py-1 gap-1.5", lg: "text-sm px-3 py-1.5 gap-2" };
  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${c.bg} ${c.text} ${sizes[size]} transition-all duration-200 hover:scale-105`}>
      <Icon className={`${size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} transition-transform duration-200`} />
      {c.label}
    </span>
  );
};
