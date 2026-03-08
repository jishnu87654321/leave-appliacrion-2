const LeaveRequest = require("../models/LeaveRequest");
const User = require("../models/User");
const LeaveType = require("../models/LeaveType");
const AuditTrail = require("../models/AuditTrail");
const { AppError } = require("../middleware/errorHandler");
const { canonicalRole } = require("../utils/roles");

/**
 * GET /api/reports/employee — Employee-wise report
 */
exports.employeeReport = async (req, res, next) => {
  try {
    const { startDate, endDate, department, employeeId } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    let userQuery = { role: { $nin: ["HR_ADMIN", "hr_admin", "ADMIN", "HR"] }, isActive: true };
    if (department) userQuery.department = department;
    if (employeeId) userQuery._id = employeeId;

    // Data boundary for managers
    const role = canonicalRole(req.user.role);
    if (role === "MANAGER") {
      userQuery.$or = [{ managerId: req.user._id }, { _id: req.user._id }];
    }

    const employees = await User.find(userQuery).select("name email department designation joinDate probationStatus leaveBalances");
    const leaveTypes = await LeaveType.find({ isActive: true });

    const report = await Promise.all(employees.map(async (emp) => {
      const query = { employee: emp._id };
      if (Object.keys(dateFilter).length) query.fromDate = dateFilter;

      const requests = await LeaveRequest.find(query).populate("leaveType", "name code");
      const byType = {};
      leaveTypes.forEach(lt => { byType[lt.code] = { name: lt.name, approved: 0, pending: 0, rejected: 0 }; });
      requests.forEach(r => {
        const lt = r.leaveType;
        if (lt && byType[lt.code]) {
          if (r.status === "APPROVED") byType[lt.code].approved += r.totalDays;
          else if (r.status === "PENDING") byType[lt.code].pending += r.totalDays;
          else if (r.status === "REJECTED") byType[lt.code].rejected += 1;
        }
      });
      const leaveTypeIdToCode = new Map(leaveTypes.map((lt) => [lt._id.toString(), lt.code]));
      let earned_leave = 0;
      let sick_leave = 0;
      let casual_leave = 0;
      (emp.leaveBalances || []).forEach((b) => {
        const code = leaveTypeIdToCode.get(String(b.leaveTypeId));
        if (code === "EL") earned_leave = b.balance || 0;
        if (code === "SL") sick_leave = b.balance || 0;
        if (code === "CL") casual_leave = b.balance || 0;
      });
      return {
        employee: { id: emp._id, name: emp.name, email: emp.email, department: emp.department, designation: emp.designation },
        totalRequests: requests.length,
        totalApprovedDays: requests.filter(r => r.status === "APPROVED").reduce((s, r) => s + r.totalDays, 0),
        totalPending: requests.filter(r => r.status === "PENDING").length,
        totalRejected: requests.filter(r => r.status === "REJECTED").length,
        byType,
        balances: emp.leaveBalances,
        earned_leave,
        sick_leave,
        casual_leave,
        earnedLeave: earned_leave,
        sickLeave: sick_leave,
        casualLeave: casual_leave,
      };
    }));

    await AuditTrail.log({ action: "Employee Report Generated", category: "REPORT", performedBy: req.user._id, performedByName: req.user.name, performedByRole: req.user.role, target: "Employee Report", metadata: { department: department || "ALL", dateRange: `${startDate || "start"} to ${endDate || "now"}` } });

    res.json({ success: true, count: report.length, data: { report } });
  } catch (err) { next(err); }
};

/**
 * GET /api/reports/department — Department-wise report
 */
exports.departmentReport = async (req, res, next) => {
  try {
    const role = canonicalRole(req.user.role);
    if (role !== "HR_ADMIN") {
      return next(new AppError("Only HR Admins can view cross-department reports.", 403));
    }
    const { startDate, endDate } = req.query;
    const departments = [...new Set((await User.distinct("department")))];
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const report = await Promise.all(departments.map(async (dept) => {
      const empIds = (await User.find({ department: dept, isActive: true })).map(u => u._id);
      const query = { employee: { $in: empIds } };
      if (Object.keys(dateFilter).length) query.fromDate = dateFilter;
      const requests = await LeaveRequest.find(query);
      return {
        department: dept,
        totalEmployees: empIds.length,
        totalRequests: requests.length,
        totalApprovedDays: requests.filter(r => r.status === "APPROVED").reduce((s, r) => s + r.totalDays, 0),
        approvalRate: requests.length > 0 ? Math.round((requests.filter(r => r.status === "APPROVED").length / requests.length) * 100) : 0,
        avgDaysPerEmployee: empIds.length > 0 ? (requests.filter(r => r.status === "APPROVED").reduce((s, r) => s + r.totalDays, 0) / empIds.length).toFixed(1) : 0,
      };
    }));

    res.json({ success: true, data: { report } });
  } catch (err) { next(err); }
};

/**
 * GET /api/reports/monthly — Monthly summary
 */
exports.monthlyReport = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const pipeline = [
      { $match: { fromDate: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) } } },
      { $group: { _id: { month: { $month: "$fromDate" }, status: "$status" }, count: { $sum: 1 }, totalDays: { $sum: "$totalDays" } } },
      { $sort: { "_id.month": 1 } },
    ];
    const raw = await LeaveRequest.aggregate(pipeline);
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(2000, i, 1).toLocaleString("en-US", { month: "long" }),
      approved: 0, rejected: 0, pending: 0, cancelled: 0, totalDays: 0,
    }));
    raw.forEach(r => {
      const m = months[r._id.month - 1];
      if (m) {
        m[r._id.status.toLowerCase()] += r.count;
        if (r._id.status === "APPROVED") m.totalDays += r.totalDays;
      }
    });
    res.json({ success: true, data: { year, report: months } });
  } catch (err) { next(err); }
};

/**
 * GET /api/reports/export — CSV export
 */
exports.exportCSV = async (req, res, next) => {
  try {
    const { startDate, endDate, department, status, format = "csv" } = req.query;
    const query = {};
    if (status) query.status = status;
    if (startDate && endDate) { query.fromDate = { $gte: new Date(startDate) }; query.toDate = { $lte: new Date(endDate) }; }

    const role = canonicalRole(req.user.role);
    let leaves = await LeaveRequest.find(query).populate("employee", "name email department designation managerId").populate("leaveType", "name code").sort({ createdAt: -1 });

    // Data boundary for managers
    if (role === "MANAGER") {
      leaves = leaves.filter(l => l.employee?._id.toString() === req.user._id.toString() || l.employee?.managerId?.toString() === req.user._id.toString());
    }

    if (department) leaves = leaves.filter(l => l.employee?.department === department);

    const rows = [
      ["Employee", "Email", "Department", "Leave Type", "From Date", "To Date", "Days", "Half Day", "Status", "Reason", "Comments", "Applied On", "Updated On"],
      ...leaves.map(l => [
        l.employee?.name || "", l.employee?.email || "", l.employee?.department || "",
        l.leaveType?.name || "", l.fromDate?.toISOString().split("T")[0] || "",
        l.toDate?.toISOString().split("T")[0] || "", l.totalDays, l.halfDay ? "Yes" : "No",
        l.status, l.reason, l.comments, l.createdAt?.toISOString().split("T")[0] || "", l.updatedAt?.toISOString().split("T")[0] || "",
      ]),
    ];

    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="leave_report_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
};

/**
 * GET /api/reports/audit-trail — Audit trail (HR)
 */
exports.getAuditTrail = async (req, res, next) => {
  try {
    const { category, performedBy, page = 1, limit = 50 } = req.query;
    const query = {};
    if (category) query.category = category;
    if (performedBy) query.performedBy = performedBy;
    const [entries, total] = await Promise.all([
      AuditTrail.find(query).populate("performedBy", "name email role").sort({ timestamp: -1 }).skip((page - 1) * limit).limit(parseInt(limit)),
      AuditTrail.countDocuments(query),
    ]);
    res.json({ success: true, count: entries.length, total, pages: Math.ceil(total / limit), data: { entries } });
  } catch (err) { next(err); }
};
