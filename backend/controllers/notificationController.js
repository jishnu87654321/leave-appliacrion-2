const Notification = require("../models/Notification");
const { AppError } = require("../middleware/errorHandler");

/**
 * GET /api/notifications — Get my notifications
 */
exports.getMyNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const query = { user: req.user._id };
    if (unreadOnly === "true") query.isRead = false;

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .populate("relatedLeaveRequest", "leaveType fromDate toDate status")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

    res.json({
      success: true,
      count: notifications.length,
      total,
      unreadCount,
      pages: Math.ceil(total / limit),
      data: { notifications },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/notifications/unread-count — Get unread notification count
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({ 
      user: req.user._id, 
      isRead: false 
    });

    res.json({
      success: true,
      data: { unreadCount },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/notifications/:id/read — Mark as read
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notification) return next(new AppError("Notification not found.", 404));

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({ success: true, message: "Notification marked as read.", data: { notification } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/notifications/read-all — Mark all as read
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.json({ success: true, message: "All notifications marked as read." });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/notifications/:id — Delete notification
 */
exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notification) return next(new AppError("Notification not found.", 404));

    await notification.deleteOne();

    res.json({ success: true, message: "Notification deleted." });
  } catch (err) {
    next(err);
  }
};
