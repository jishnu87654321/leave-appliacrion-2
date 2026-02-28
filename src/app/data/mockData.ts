export type Role = "EMPLOYEE" | "MANAGER" | "HR_ADMIN";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type AccrualType = "MONTHLY" | "YEARLY";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  department: string;
  designation: string;
  managerId?: string;
  avatar: string;
  joinDate: string;
  probationStatus: boolean;
  leaveBalances: Record<string, number>;
  phone: string;
  isActive: boolean;
}

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  color: string;
  accrualType: AccrualType;
  accrualRate: number;
  carryForwardLimit: number;
  allowNegativeBalance: boolean;
  applicableDuringProbation: boolean;
  maxConsecutiveDays: number;
  requiresDocument: boolean;
  description: string;
}

export interface ApprovalStep {
  level: number;
  approverId: string;
  approverName: string;
  status: LeaveStatus;
  comment?: string;
  actionDate?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  leaveTypeColor: string;
  fromDate: string;
  toDate: string;
  totalDays: number;
  halfDay: boolean;
  halfDaySession?: "MORNING" | "AFTERNOON";
  reason: string;
  status: LeaveStatus;
  approvalHistory: ApprovalStep[];
  comments: string;
  createdAt: string;
  updatedAt: string;
  attachmentUrl?: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: "INFO" | "SUCCESS" | "WARNING" | "DANGER";
  readStatus: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  action: string;
  performedBy: string;
  performedByRole: Role;
  target: string;
  timestamp: string;
  metadata: Record<string, string>;
  category: "LEAVE" | "USER" | "POLICY" | "AUTH" | "REPORT";
}

// ── LEAVE TYPES ──────────────────────────────────────────
export const leaveTypes: LeaveType[] = [
  { id: "lt1", name: "Casual Leave", code: "CL", color: "#3B82F6", accrualType: "YEARLY", accrualRate: 12, carryForwardLimit: 5, allowNegativeBalance: false, applicableDuringProbation: true, maxConsecutiveDays: 3, requiresDocument: false, description: "General personal leave for casual purposes" },
  { id: "lt2", name: "Sick Leave", code: "SL", color: "#EF4444", accrualType: "YEARLY", accrualRate: 10, carryForwardLimit: 0, allowNegativeBalance: false, applicableDuringProbation: true, maxConsecutiveDays: 7, requiresDocument: true, description: "Leave for medical illness or health reasons" },
  { id: "lt3", name: "Earned Leave", code: "EL", color: "#10B981", accrualType: "MONTHLY", accrualRate: 1.5, carryForwardLimit: 30, allowNegativeBalance: false, applicableDuringProbation: false, maxConsecutiveDays: 30, requiresDocument: false, description: "Earned/Paid leave accrued over time" },
  { id: "lt5", name: "Work From Home", code: "WFH", color: "#8B5CF6", accrualType: "MONTHLY", accrualRate: 4, carryForwardLimit: 0, allowNegativeBalance: false, applicableDuringProbation: true, maxConsecutiveDays: 30, requiresDocument: false, description: "Remote work from home days" },
  { id: "lt6", name: "Optional Holiday", code: "OH", color: "#F97316", accrualType: "YEARLY", accrualRate: 2, carryForwardLimit: 0, allowNegativeBalance: false, applicableDuringProbation: true, maxConsecutiveDays: 1, requiresDocument: false, description: "Optional holidays from pre-defined list" },
];

// ── USERS ──────────────────────────────────────────────────
export const users: User[] = [
  {
    id: "u1", name: "John Doe", email: "employee@demo.com", password: "password",
    role: "EMPLOYEE", department: "Engineering", designation: "Software Engineer",
    managerId: "u3", avatar: "JD", joinDate: "2022-06-01", probationStatus: false,
    phone: "+1-555-0101", isActive: true,
    leaveBalances: { lt1: 12, lt2: 10, lt3: 1.5, lt5: 4, lt6: 2 },
  },
  {
    id: "u2", name: "Alice Johnson", email: "alice@demo.com", password: "password",
    role: "EMPLOYEE", department: "Engineering", designation: "Frontend Developer",
    managerId: "u3", avatar: "AJ", joinDate: "2023-01-15", probationStatus: false,
    phone: "+1-555-0102", isActive: true,
    leaveBalances: { lt1: 12, lt2: 10, lt3: 1.5, lt5: 4, lt6: 2 },
  },
  {
    id: "u3", name: "Sarah Wilson", email: "manager@demo.com", password: "password",
    role: "MANAGER", department: "Engineering", designation: "Engineering Manager",
    avatar: "SW", joinDate: "2020-03-10", probationStatus: false,
    phone: "+1-555-0103", isActive: true,
    leaveBalances: { lt1: 12, lt2: 10, lt3: 1.5, lt5: 4, lt6: 2 },
  },
  {
    id: "u4", name: "Mike Chen", email: "mike@demo.com", password: "password",
    role: "EMPLOYEE", department: "Engineering", designation: "Backend Developer",
    managerId: "u3", avatar: "MC", joinDate: "2023-08-01", probationStatus: true,
    phone: "+1-555-0104", isActive: true,
    leaveBalances: { lt1: 12, lt2: 10, lt3: 1.5, lt5: 4, lt6: 2 },
  },
  {
    id: "u5", name: "Emily Rodriguez", email: "emily@demo.com", password: "password",
    role: "EMPLOYEE", department: "Marketing", designation: "Marketing Specialist",
    managerId: "u6", avatar: "ER", joinDate: "2021-11-20", probationStatus: false,
    phone: "+1-555-0105", isActive: true,
    leaveBalances: { lt1: 12, lt2: 10, lt3: 1.5, lt5: 4, lt6: 2 },
  },
  {
    id: "u6", name: "David Park", email: "david@demo.com", password: "password",
    role: "MANAGER", department: "Marketing", designation: "Marketing Manager",
    avatar: "DP", joinDate: "2019-07-15", probationStatus: false,
    phone: "+1-555-0106", isActive: true,
    leaveBalances: { lt1: 12, lt2: 10, lt3: 1.5, lt5: 4, lt6: 2 },
  },
  {
    id: "u7", name: "Admin User", email: "admin@demo.com", password: "password",
    role: "HR_ADMIN", department: "Human Resources", designation: "HR Administrator",
    avatar: "AU", joinDate: "2018-05-01", probationStatus: false,
    phone: "+1-555-0107", isActive: true,
    leaveBalances: { lt1: 12, lt2: 10, lt3: 1.5, lt5: 4, lt6: 2 },
  },
  {
    id: "u8", name: "Priya Sharma", email: "priya@demo.com", password: "password",
    role: "EMPLOYEE", department: "Design", designation: "UI/UX Designer",
    managerId: "u3", avatar: "PS", joinDate: "2022-09-12", probationStatus: false,
    phone: "+1-555-0108", isActive: true,
    leaveBalances: { lt1: 12, lt2: 10, lt3: 1.5, lt5: 4, lt6: 2 },
  },
];

// ── LEAVE REQUESTS ───────────────────────────────────────────
export const leaveRequests: LeaveRequest[] = [
  {
    id: "lr1", employeeId: "u1", employeeName: "John Doe", department: "Engineering",
    leaveTypeId: "lt1", leaveTypeName: "Casual Leave", leaveTypeCode: "CL", leaveTypeColor: "#3B82F6",
    fromDate: "2025-01-15", toDate: "2025-01-16", totalDays: 2, halfDay: false,
    reason: "Personal work and family function", status: "APPROVED", comments: "",
    approvalHistory: [{ level: 1, approverId: "u3", approverName: "Sarah Wilson", status: "APPROVED", comment: "Approved. Enjoy!", actionDate: "2025-01-14" }],
    createdAt: "2025-01-13T09:00:00Z", updatedAt: "2025-01-14T10:00:00Z",
  },
  {
    id: "lr2", employeeId: "u1", employeeName: "John Doe", department: "Engineering",
    leaveTypeId: "lt2", leaveTypeName: "Sick Leave", leaveTypeCode: "SL", leaveTypeColor: "#EF4444",
    fromDate: "2025-02-03", toDate: "2025-02-03", totalDays: 1, halfDay: false,
    reason: "Down with fever and doctor advised rest", status: "APPROVED", comments: "",
    approvalHistory: [{ level: 1, approverId: "u3", approverName: "Sarah Wilson", status: "APPROVED", comment: "Get well soon!", actionDate: "2025-02-03" }],
    createdAt: "2025-02-03T08:30:00Z", updatedAt: "2025-02-03T09:00:00Z",
  },
  {
    id: "lr3", employeeId: "u1", employeeName: "John Doe", department: "Engineering",
    leaveTypeId: "lt5", leaveTypeName: "Work From Home", leaveTypeCode: "WFH", leaveTypeColor: "#8B5CF6",
    fromDate: "2025-03-10", toDate: "2025-03-12", totalDays: 3, halfDay: false,
    reason: "Home internet setup and minor renovation work", status: "APPROVED", comments: "",
    approvalHistory: [{ level: 1, approverId: "u3", approverName: "Sarah Wilson", status: "APPROVED", comment: "Approved for WFH", actionDate: "2025-03-09" }],
    createdAt: "2025-03-07T11:00:00Z", updatedAt: "2025-03-09T14:00:00Z",
  },
  {
    id: "lr4", employeeId: "u1", employeeName: "John Doe", department: "Engineering",
    leaveTypeId: "lt1", leaveTypeName: "Casual Leave", leaveTypeCode: "CL", leaveTypeColor: "#3B82F6",
    fromDate: "2025-06-05", toDate: "2025-06-07", totalDays: 3, halfDay: false,
    reason: "Family trip to attend cousin's wedding ceremony", status: "PENDING", comments: "",
    approvalHistory: [],
    createdAt: "2025-05-30T10:00:00Z", updatedAt: "2025-05-30T10:00:00Z",
  },
  {
    id: "lr5", employeeId: "u1", employeeName: "John Doe", department: "Engineering",
    leaveTypeId: "lt3", leaveTypeName: "Earned Leave", leaveTypeCode: "EL", leaveTypeColor: "#10B981",
    fromDate: "2025-05-20", toDate: "2025-05-24", totalDays: 5, halfDay: false,
    reason: "Annual vacation with family", status: "REJECTED", comments: "Team is short-staffed during product launch week.",
    approvalHistory: [{ level: 1, approverId: "u3", approverName: "Sarah Wilson", status: "REJECTED", comment: "Team is short-staffed during product launch week.", actionDate: "2025-05-18" }],
    createdAt: "2025-05-15T09:00:00Z", updatedAt: "2025-05-18T14:00:00Z",
  },
  {
    id: "lr6", employeeId: "u2", employeeName: "Alice Johnson", department: "Engineering",
    leaveTypeId: "lt1", leaveTypeName: "Casual Leave", leaveTypeCode: "CL", leaveTypeColor: "#3B82F6",
    fromDate: "2025-06-10", toDate: "2025-06-11", totalDays: 2, halfDay: false,
    reason: "Personal work", status: "PENDING", comments: "",
    approvalHistory: [],
    createdAt: "2025-06-02T08:00:00Z", updatedAt: "2025-06-02T08:00:00Z",
  },
  {
    id: "lr7", employeeId: "u4", employeeName: "Mike Chen", department: "Engineering",
    leaveTypeId: "lt2", leaveTypeName: "Sick Leave", leaveTypeCode: "SL", leaveTypeColor: "#EF4444",
    fromDate: "2025-06-12", toDate: "2025-06-12", totalDays: 0.5, halfDay: true, halfDaySession: "MORNING",
    reason: "Doctor appointment in the morning", status: "PENDING", comments: "",
    approvalHistory: [],
    createdAt: "2025-06-10T07:00:00Z", updatedAt: "2025-06-10T07:00:00Z",
  },
  {
    id: "lr8", employeeId: "u8", employeeName: "Priya Sharma", department: "Design",
    leaveTypeId: "lt5", leaveTypeName: "Work From Home", leaveTypeCode: "WFH", leaveTypeColor: "#8B5CF6",
    fromDate: "2025-06-16", toDate: "2025-06-18", totalDays: 3, halfDay: false,
    reason: "Internet connectivity issues at home resolved, prefer to work from home for focus work",
    status: "APPROVED", comments: "",
    approvalHistory: [{ level: 1, approverId: "u3", approverName: "Sarah Wilson", status: "APPROVED", actionDate: "2025-06-13" }],
    createdAt: "2025-06-11T10:00:00Z", updatedAt: "2025-06-13T09:00:00Z",
  },
  {
    id: "lr9", employeeId: "u5", employeeName: "Emily Rodriguez", department: "Marketing",
    leaveTypeId: "lt3", leaveTypeName: "Earned Leave", leaveTypeCode: "EL", leaveTypeColor: "#10B981",
    fromDate: "2025-06-23", toDate: "2025-06-27", totalDays: 5, halfDay: false,
    reason: "Annual vacation", status: "PENDING", comments: "",
    approvalHistory: [],
    createdAt: "2025-06-15T11:00:00Z", updatedAt: "2025-06-15T11:00:00Z",
  },
];

// ── NOTIFICATIONS ─────────────────────────────────────────────
export const notifications: Record<string, Notification[]> = {
  u1: [
    { id: "n1", userId: "u1", message: "Your Casual Leave request for Jun 5-7 is pending approval", type: "INFO", readStatus: false, createdAt: "2025-05-30T10:05:00Z" },
    { id: "n2", userId: "u1", message: "Earned Leave request for May 20-24 was rejected. Reason: Team is short-staffed.", type: "DANGER", readStatus: false, createdAt: "2025-05-18T14:05:00Z" },
    { id: "n3", userId: "u1", message: "Your WFH request for Mar 10-12 has been approved!", type: "SUCCESS", readStatus: true, createdAt: "2025-03-09T14:05:00Z" },
  ],
  u3: [
    { id: "n4", userId: "u3", message: "John Doe has applied for 3 days Casual Leave (Jun 5-7). Action required.", type: "WARNING", readStatus: false, createdAt: "2025-05-30T10:05:00Z" },
    { id: "n5", userId: "u3", message: "Alice Johnson has applied for 2 days Casual Leave (Jun 10-11). Action required.", type: "WARNING", readStatus: false, createdAt: "2025-06-02T08:05:00Z" },
    { id: "n6", userId: "u3", message: "Mike Chen has applied for Half Day Sick Leave (Jun 12 Morning). Action required.", type: "WARNING", readStatus: true, createdAt: "2025-06-10T07:05:00Z" },
  ],
  u7: [
    { id: "n7", userId: "u7", message: "3 new leave requests are pending in the system", type: "INFO", readStatus: false, createdAt: "2025-06-15T08:00:00Z" },
    { id: "n8", userId: "u7", message: "Monthly leave accrual processed successfully for June 2025", type: "SUCCESS", readStatus: false, createdAt: "2025-06-01T00:05:00Z" },
    { id: "n9", userId: "u7", message: "Mike Chen is still in probation period (ends Aug 2025)", type: "WARNING", readStatus: true, createdAt: "2025-06-10T09:00:00Z" },
  ],
};

// ── AUDIT TRAIL ───────────────────────────────────────────────
export const auditTrail: AuditEntry[] = [
  { id: "a1", action: "Leave Application Submitted", performedBy: "John Doe", performedByRole: "EMPLOYEE", target: "Leave Request #lr4 (CL - Jun 5-7)", timestamp: "2025-05-30T10:00:00Z", category: "LEAVE", metadata: { leaveType: "Casual Leave", days: "3", status: "PENDING" } },
  { id: "a2", action: "Leave Request Rejected", performedBy: "Sarah Wilson", performedByRole: "MANAGER", target: "John Doe's Earned Leave (May 20-24)", timestamp: "2025-05-18T14:00:00Z", category: "LEAVE", metadata: { leaveType: "Earned Leave", days: "5", reason: "Team short-staffed" } },
  { id: "a3", action: "Leave Request Approved", performedBy: "Sarah Wilson", performedByRole: "MANAGER", target: "John Doe's WFH (Mar 10-12)", timestamp: "2025-03-09T14:00:00Z", category: "LEAVE", metadata: { leaveType: "WFH", days: "3" } },
  { id: "a4", action: "Leave Balance Updated", performedBy: "Admin User", performedByRole: "HR_ADMIN", target: "John Doe - CL Balance", timestamp: "2025-03-01T00:05:00Z", category: "POLICY", metadata: { field: "CL Balance", oldValue: "10", newValue: "12" } },
  { id: "a5", action: "Leave Policy Modified", performedBy: "Admin User", performedByRole: "HR_ADMIN", target: "Earned Leave - Carry Forward Limit", timestamp: "2025-02-15T11:00:00Z", category: "POLICY", metadata: { field: "carryForwardLimit", oldValue: "25", newValue: "30" } },
  { id: "a6", action: "New User Registered", performedBy: "Admin User", performedByRole: "HR_ADMIN", target: "Mike Chen (EMPLOYEE)", timestamp: "2023-08-01T09:00:00Z", category: "USER", metadata: { department: "Engineering", role: "EMPLOYEE" } },
  { id: "a7", action: "Monthly Accrual Processed", performedBy: "System", performedByRole: "HR_ADMIN", target: "All Active Employees", timestamp: "2025-06-01T00:05:00Z", category: "POLICY", metadata: { month: "June 2025", employeesProcessed: "8" } },
  { id: "a8", action: "Leave Request Approved", performedBy: "Sarah Wilson", performedByRole: "MANAGER", target: "Priya Sharma's WFH (Jun 16-18)", timestamp: "2025-06-13T09:00:00Z", category: "LEAVE", metadata: { leaveType: "WFH", days: "3" } },
  { id: "a9", action: "Leave Application Submitted", performedBy: "Alice Johnson", performedByRole: "EMPLOYEE", target: "Leave Request #lr6 (CL - Jun 10-11)", timestamp: "2025-06-02T08:00:00Z", category: "LEAVE", metadata: { leaveType: "Casual Leave", days: "2", status: "PENDING" } },
  { id: "a10", action: "User Status Updated", performedBy: "Admin User", performedByRole: "HR_ADMIN", target: "Emily Rodriguez", timestamp: "2025-01-10T10:00:00Z", category: "USER", metadata: { field: "probationStatus", oldValue: "true", newValue: "false" } },
];

// Charts and statistics removed - use backend reports API instead

// Helper to get team members for a manager
export const getTeamMembers = (managerId: string): User[] =>
  users.filter((u) => u.managerId === managerId);

// Helper to get leave requests for an employee
export const getEmployeeLeaveRequests = (employeeId: string): LeaveRequest[] =>
  leaveRequests.filter((r) => r.employeeId === employeeId);

// Helper to get team leave requests
export const getTeamLeaveRequests = (managerId: string): LeaveRequest[] => {
  const teamIds = getTeamMembers(managerId).map((u) => u.id);
  return leaveRequests.filter((r) => teamIds.includes(r.employeeId));
};
