const LeaveRequest = require("../models/LeaveRequest");
const User = require("../models/User");
const { AppError } = require("../middleware/errorHandler");
const { canonicalRole } = require("../utils/roles");

const VISIBLE_STATUSES = ["PENDING", "HR_PENDING", "APPROVED", "REJECTED"];

function parseDateInput(value, label) {
  const text = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new AppError(`Invalid ${label}. Use YYYY-MM-DD format.`, 400);
  }
  const parsed = new Date(`${text}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new AppError(`Invalid ${label}.`, 400);
  }
  return parsed;
}

function toIsoDate(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

function eachDateBetween(start, end) {
  const dates = [];
  const current = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  while (current <= last) {
    dates.push(toIsoDate(current));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

async function getScopeFilter(req) {
  const role = canonicalRole(req.user.role);
  const departmentFilter = String(req.query.department || "").trim();

  if (role === "HR_ADMIN") {
    if (!departmentFilter || departmentFilter === "ALL") return {};
    const departmentUsers = await User.find({ isActive: true, department: departmentFilter }).select("_id");
    return { employee: { $in: departmentUsers.map((u) => u._id) } };
  }

  if (role === "MANAGER") {
    const teamMembers = await User.find({ managerId: req.user._id, isActive: true }).select("_id");
    const teamIds = teamMembers.map((u) => u._id);
    return { employee: { $in: teamIds } };
  }

  return { employee: req.user._id };
}

function normalizeLeaveItem(leave) {
  return {
    userId: leave.employee?._id?.toString() || "",
    name: leave.employee?.name || "Unknown",
    department: leave.employee?.department || "",
    leaveType: leave.leaveType?.code || "",
    leaveTypeName: leave.leaveType?.name || "",
    status: leave.status,
    startDate: toIsoDate(leave.fromDate),
    endDate: toIsoDate(leave.toDate),
    createdAt: leave.createdAt,
  };
}

/**
 * GET /api/calendar/leaves?start=YYYY-MM-DD&end=YYYY-MM-DD
 * Returns per-day summary with first 5 shown entries and total count.
 */
exports.getCalendarLeaveSummary = async (req, res, next) => {
  try {
    const start = parseDateInput(req.query.start, "start");
    const end = parseDateInput(req.query.end, "end");
    if (end < start) return next(new AppError("end date cannot be before start date.", 400));

    const rangeDays = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
    if (rangeDays > 62) return next(new AppError("Date range too large. Maximum 62 days.", 400));

    const scopeFilter = await getScopeFilter(req);
    const leaves = await LeaveRequest.find({
      ...scopeFilter,
      status: { $in: VISIBLE_STATUSES },
      fromDate: { $lte: end },
      toDate: { $gte: start },
    })
      .populate("employee", "name department")
      .populate("leaveType", "name code")
      .sort({ createdAt: 1 });

    const startIso = toIsoDate(start);
    const endIso = toIsoDate(end);
    const bucket = new Map();

    for (const leave of leaves) {
      const item = normalizeLeaveItem(leave);
      const overlapStart = item.startDate > startIso ? item.startDate : startIso;
      const overlapEnd = item.endDate < endIso ? item.endDate : endIso;
      const dayStart = parseDateInput(overlapStart, "overlapStart");
      const dayEnd = parseDateInput(overlapEnd, "overlapEnd");

      for (const date of eachDateBetween(dayStart, dayEnd)) {
        if (!bucket.has(date)) bucket.set(date, []);
        bucket.get(date).push(item);
      }
    }

    const summary = Array.from(bucket.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, items]) => {
        const cappedTotal = Math.min(items.length, 30);
        return {
          date,
          total: items.length,
          cappedTotal,
          shown: items.slice(0, 5).map(({ userId, name, leaveType, status }) => ({ userId, name, leaveType, status })),
        };
      });

    res.json({ success: true, data: { days: summary } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/calendar/leaves/:date?limit=1000&page=1
 * Returns full applicant list for a specific date.
 */
exports.getCalendarLeavesByDate = async (req, res, next) => {
  try {
    const date = parseDateInput(req.params.date, "date");
    const dateIso = toIsoDate(date);
    const limit = Math.max(1, Math.min(Number(req.query.limit) || 1000, 5000));
    const page = Math.max(1, Number(req.query.page) || 1);

    const scopeFilter = await getScopeFilter(req);
    const leaves = await LeaveRequest.find({
      ...scopeFilter,
      status: { $in: VISIBLE_STATUSES },
      fromDate: { $lte: new Date(`${dateIso}T23:59:59.999Z`) },
      toDate: { $gte: new Date(`${dateIso}T00:00:00.000Z`) },
    })
      .populate("employee", "name department")
      .populate("leaveType", "name code")
      .sort({ createdAt: 1 });

    const items = leaves.map(normalizeLeaveItem);
    const total = items.length;
    const startIndex = (page - 1) * limit;
    const paged = items.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      data: {
        date: dateIso,
        total,
        page,
        limit,
        pages: Math.max(1, Math.ceil(total / limit)),
        items: paged,
      },
    });
  } catch (err) {
    next(err);
  }
};
