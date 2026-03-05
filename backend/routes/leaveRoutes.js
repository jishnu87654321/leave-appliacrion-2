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
  downloadAttachment,
  getMyBalance,
  convertCasualBalance,
  convertToEarnedBalance,
} = require("../controllers/leaveController");
const { hrOverrideLeave } = require("../controllers/hrOverrideController");

router.use(protect);

// Employee routes
router.post("/apply", applyLeave);
router.get("/my-leaves", getMyLeaves);
router.get("/my", getMyLeaves);
router.get("/balance", getMyBalance);
router.post("/convert-casual-to-earned", convertCasualBalance);
router.post("/convert-to-earned", convertToEarnedBalance);
router.get("/team-calendar", getTeamCalendar);
router.get("/stats/dashboard", getDashboardStats);
router.get("/:userId/attachments/:fileName", downloadAttachment);
router.get("/:id", getLeaveById);
router.put("/:id/cancel", cancelLeave);

// Manager routes - can access all leaves and approve/reject
router.get("/team/requests", restrictTo("MANAGER", "HR_ADMIN"), getTeamLeaves);
router.get("/", restrictTo("MANAGER", "HR_ADMIN"), getAllLeaves);
router.put("/:id/approve", restrictTo("MANAGER"), canManageLeave, approveLeave);
router.patch("/:id/approve", restrictTo("MANAGER"), canManageLeave, approveLeave);
router.post("/approve/:id", restrictTo("MANAGER"), canManageLeave, approveLeave);
router.put("/:id/reject", restrictTo("MANAGER"), canManageLeave, rejectLeave);
router.patch("/:id/reject", restrictTo("MANAGER"), canManageLeave, rejectLeave);
router.post("/reject/:id", restrictTo("MANAGER"), canManageLeave, rejectLeave);
router.put("/:id/force-cancel", restrictTo("HR_ADMIN"), forceCancelLeave);

// HR Admin only routes
router.put("/:id/override", restrictTo("HR_ADMIN"), hrOverrideLeave); // Only HR can override manager approval
router.patch("/:id/hr-override", restrictTo("HR_ADMIN"), hrOverrideLeave);
router.post("/hr-override/:id", restrictTo("HR_ADMIN"), hrOverrideLeave);

module.exports = router;
