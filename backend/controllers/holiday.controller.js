const Holiday = require("../models/Holiday");
const { AppError } = require("../middleware/errorHandler");
const { queueAdminEventNotification } = require("../services/notificationMailer");

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function normalizeDate(value) {
  const text = String(value || "").trim();
  if (!DATE_REGEX.test(text)) return null;
  return text;
}

const xss = require("xss");

exports.upsertHoliday = async (req, res, next) => {
  try {
    const date = normalizeDate(req.body?.date);
    const title = xss(String(req.body?.title || "").trim());

    if (!date) return next(new AppError("Invalid date. Use YYYY-MM-DD.", 400));
    if (!title) return next(new AppError("Holiday title is required.", 400));

    const existing = await Holiday.findOne({ date }).lean();

    const holiday = await Holiday.findOneAndUpdate(
      { date },
      {
        $set: {
          title,
          createdBy: req.user._id,
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    queueAdminEventNotification("HOLIDAY_CALENDAR_UPDATED", {
      updateType: existing ? "Holiday Updated" : "Holiday Added",
      holidayDate: holiday.date,
      holidayTitle: holiday.title,
      changedBy: req.user?.name || "System",
      changedByEmail: req.user?.email || "",
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      holiday: {
        date: holiday.date,
        title: holiday.title,
      },
    });
  } catch (err) {
    return next(err);
  }
};

exports.listHolidays = async (req, res, next) => {
  try {
    const start = req.query?.start ? normalizeDate(req.query.start) : null;
    const end = req.query?.end ? normalizeDate(req.query.end) : null;

    if (req.query?.start && !start) return next(new AppError("Invalid start date. Use YYYY-MM-DD.", 400));
    if (req.query?.end && !end) return next(new AppError("Invalid end date. Use YYYY-MM-DD.", 400));

    const query = {};
    if (start && end) {
      if (end < start) return next(new AppError("end date cannot be before start date.", 400));
      query.date = { $gte: start, $lte: end };
    } else if (start) {
      query.date = { $gte: start };
    } else if (end) {
      query.date = { $lte: end };
    }

    const items = await Holiday.find(query).sort({ date: 1 }).select("date title -_id");
    return res.json({ success: true, items });
  } catch (err) {
    return next(err);
  }
};

exports.deleteHoliday = async (req, res, next) => {
  try {
    const date = normalizeDate(req.params?.date);
    if (!date) return next(new AppError("Invalid date. Use YYYY-MM-DD.", 400));

    const deleted = await Holiday.findOneAndDelete({ date });
    if (!deleted) return next(new AppError("Holiday not found.", 404));

    return res.json({ success: true, message: "Holiday deleted successfully." });
  } catch (err) {
    return next(err);
  }
};
