const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { restrictTo, canManageLeave } = require("../middleware/roleCheck");
const {
  applyLeave,
  getMyLeaves,
  getLeaveById,
  cancelLeave,
  getTeamLeaves,
  approveLeave,
  rejectLeave,
  getAllLeaves,
  getTeamCalendar,
  getDashboardStats,
  forceCancelLeave,
} = require("../controllers/leaveController");
const { hrOverrideLeave } = require("../controllers/hrOverrideController");

router.use(protect);

// Employee routes
router.post("/apply", applyLeave);
router.get("/my-leaves", getMyLeaves);
router.get("/team-calendar", getTeamCalendar);
router.get("/stats/dashboard", getDashboardStats);
router.get("/:id", getLeaveById);
router.put("/:id/cancel", cancelLeave);

// Manager routes - can access all leaves and approve/reject
router.get("/team/requests", restrictTo("MANAGER", "HR_ADMIN"), getTeamLeaves);
router.get("/", restrictTo("MANAGER", "HR_ADMIN"), getAllLeaves); // Managers can view all leaves
router.put("/:id/approve", restrictTo("MANAGER", "HR_ADMIN"), canManageLeave, approveLeave);
router.put("/:id/reject", restrictTo("MANAGER", "HR_ADMIN"), canManageLeave, rejectLeave);
router.put("/:id/force-cancel", restrictTo("MANAGER", "HR_ADMIN"), forceCancelLeave); // Managers can force cancel

// HR Admin only routes
router.put("/:id/override", restrictTo("HR_ADMIN"), hrOverrideLeave); // Only HR can override manager approval

module.exports = router;
